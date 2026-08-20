import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { ClientMeResponseDto } from './dto/client-me-response.dto';

describe('ClientsController', () => {
  let clientsController: ClientsController;
  let findMeMock: jest.Mock<Promise<ClientMeResponseDto>, [string]>;

  beforeEach(() => {
    findMeMock = jest.fn<Promise<ClientMeResponseDto>, [string]>();

    const clientsService = {
      findMe: findMeMock,
    } as unknown as ClientsService;

    clientsController = new ClientsController(clientsService);
  });

  it('debe devolver los datos del cliente autenticado', async () => {
    const response: ClientMeResponseDto = {
      client: {
        id: 'client-id',
        name: 'Cliente Prueba',
        email: 'cliente@example.com',
        phone: '+54 9 11 1234-5678',
      },
      quoteRequests: [],
      workOrders: [],
    };

    findMeMock.mockResolvedValue(response);

    const result = await clientsController.findMe({
      userId: 'user-id',
    });

    expect(findMeMock).toHaveBeenCalledWith('user-id');
    expect(result).toBe(response);
  });
});
