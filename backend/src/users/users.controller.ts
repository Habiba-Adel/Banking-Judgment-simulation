import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':userId')
  findUserById(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.usersService.findUserById(userId);
  }
}