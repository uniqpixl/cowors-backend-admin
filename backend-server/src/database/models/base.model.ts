import { plainToInstance } from 'class-transformer';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  EntityType,
  IdGeneratorService,
} from '../../utils/id-generator.service';

export abstract class BaseModel extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id: string;

  // Abstract method to be implemented by each entity to specify its type
  protected abstract getEntityType(): EntityType;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      const idGenerator = new IdGeneratorService();
      this.id = idGenerator.generateId(this.getEntityType());
    }
  }

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  toDto<Dto>(dtoClass: new () => Dto): Dto {
    return plainToInstance(dtoClass, this);
  }
}
