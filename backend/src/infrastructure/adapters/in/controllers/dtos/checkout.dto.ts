import {
  IsNumber,
  IsString,
  IsEmail,
  IsNotEmpty,
  Min,
  IsOptional,
} from 'class-validator';

export class CustomerDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;
}

export class DeliveryDto {
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class CheckoutDto {
  @IsNumber()
  @Min(1)
  productId: number;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  paymentToken: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  installments?: number = 1;

  @IsString()
  @IsNotEmpty()
  acceptanceToken: string;

  @IsString()
  @IsNotEmpty()
  acceptPersonalAuth: string;

  @IsNotEmpty()
  customer: CustomerDto;

  @IsNotEmpty()
  delivery: DeliveryDto;
}
