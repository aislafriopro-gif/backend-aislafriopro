import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import {
  ClientMeResponseDto,
  ClientProfileResponseDto,
} from './dto/client-me-response.dto';
import { PaginationParamsDto, PaginatedResponse } from '../common/pagination';

describe('ClientsController', () => {
  let clientsController: ClientsController;
  let findMeMock: jest.Mock<Promise<ClientMeResponseDto>, [string]>;
  let findAllMock: jest.Mock<
    Promise<PaginatedResponse<ClientProfileResponseDto>>,
    [PaginationParamsDto]
  >;
  let findOneMock: jest.Mock<Promise<ClientMeResponseDto>, [string]>;

  beforeEach(() => {
    findMeMock = jest.fn<Promise<ClientMeResponseDto>, [string]>();
    findAllMock = jest.fn<
      Promise<PaginatedResponse<ClientProfileResponseDto>>,
      [PaginationParamsDto]
    >();
    findOneMock = jest.fn<Promise<ClientMeResponseDto>, [string]>();

    const clientsService = {
      findMe: findMeMock,
      findAll: findAllMock,
      findOne: findOneMock,
    } as unknown as ClientsService;

    clientsController = new ClientsController(clientsService);
  });

  it('debe listar clientes para admin', async () => {
    const pagination = new PaginationParamsDto();

    const response: PaginatedResponse<ClientProfileResponseDto> = {
      data: [
        {
          id: 'client-id',
          name: 'Cliente Prueba',
          email: 'cliente@example.com',
          phone: '+54 9 11 1234-5678',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    findAllMock.mockResolvedValue(response);

    const result = await clientsController.findAll(pagination);

    expect(findAllMock).toHaveBeenCalledWith(pagination);
    expect(result).toBe(response);
  });

  it('debe devolver detalle de un cliente para admin', async () => {
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

    findOneMock.mockResolvedValue(response);

    const result = await clientsController.findOne('client-id');

    expect(findOneMock).toHaveBeenCalledWith('client-id');
    expect(result).toBe(response);
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
