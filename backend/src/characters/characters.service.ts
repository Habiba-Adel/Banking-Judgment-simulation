import { Injectable } from '@nestjs/common';
import { CharactersRepository } from './characters.repository';

@Injectable()
export class CharactersService {
  constructor(private readonly charactersRepository: CharactersRepository) {}

  findAllCharacters() {
    return this.charactersRepository.findAllCharacters();
  }
}
