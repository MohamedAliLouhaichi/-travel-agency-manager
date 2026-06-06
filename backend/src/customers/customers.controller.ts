import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { BulkDeleteDto } from '../common/dto/bulk-delete.dto';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Post()
  createCustomer(@Body() createCustomerDto: CreateCustomerDto, @GetUser() currentUser: any) {
    return this.customersService.create(createCustomerDto, currentUser.id);
  }

  @Get()
  findAllCustomers(@Query('search') search?: string) {
    return this.customersService.findAll(search);
  }

  @Get(':id')
  findCustomerById(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  updateCustomer(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @GetUser() currentUser: any,
  ) {
    return this.customersService.update(id, updateCustomerDto, currentUser.id);
  }

  @Delete('bulk')
  deleteCustomers(
    @Body() bulkDeleteDto: BulkDeleteDto,
    @GetUser() currentUser: any,
  ) {
    return this.customersService.deleteMany(bulkDeleteDto.ids, currentUser.id);
  }
}
