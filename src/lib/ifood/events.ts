import 'server-only';
import { IfoodClient } from '@/lib/ifood/client';
import { createIfoodAuthService } from '@/lib/ifood/auth';
import type { IfoodEvent, IfoodEventPollingResponse } from '@/lib/ifood/types/order';
import { prisma } from '@/lib/db/prisma';
import { withTenantContext } from '@/lib/db/tenant';

export class IfoodEventService {
  private readonly client: IfoodClient;
  private readonly auth: any;

  constructor() {
    this.client = new IfoodClient();
    this.auth = createIfoodAuthService();
  }

  /**
   * Consome eventos de polling do iFood para uma organização específica.
   *
   * Fluxo:
   * 1. Obtém token válido via IfoodAuthService.
   * 2. Chama /order/v1.0/events:polling.
   * 3. Processa cada evento (ex: atualização de status de pedido).
   * 4. Envia ACK para cada evento processado com sucesso.
   */
  async pollEvents(organizationId: string) {
    try {
      // 1. Token válido (estamos assumindo ambiente 'sandbox' para o polling automático,
      // ou buscaríamos o ambiente preferencial da organização).
      const token = await this.auth.getAccessToken(organizationId, 'sandbox');

      // 2. Polling
      const response = await this.client.request<IfoodEventPollingResponse>({
        method: 'POST',
        path: '/order/v1.0/events:polling',
        bearerToken: token,
      });

      const events = response.events ?? [];
      let processedCount = 0;

      for (const event of events) {
        try {
          // 3. Processar evento
          await this.processEvent(organizationId, event);

          // 4. Acknowledgment (ACK)
          await this.client.request({
            method: 'POST',
            path: '/order/v1.0/events/acknowledgment',
            bearerToken: token,
            body: { eventId: event.id },
          });

          processedCount++;
        } catch (err) {
          console.error(`[IfoodEventService] Erro ao processar evento ${event.id}:`, err);
        }
      }

      return { processed: processedCount, total: events.length };
    } catch (err: any) {
      console.error(`[IfoodEventService] Erro no polling para org ${organizationId}:`, err);
      return { processed: 0, error: err.message };
    }
  }

  private async processEvent(organizationId: string, event: IfoodEvent) {
    if (event.type === 'ORDER_STATUS_CHANGED') {
      const { orderId, newStatus } = event.payload;

      await withTenantContext(organizationId, async (tx) => {
        await tx.order.update({
          where: {
            organizationId_ifoodOrderId: {
              organizationId,
              ifoodOrderId: orderId,
            }
          },
          data: { status: newStatus },
        });
      });
    }
  }
}
