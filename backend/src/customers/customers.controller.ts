import {
  Controller,
  Get,
  Post,
  Patch,
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
}
