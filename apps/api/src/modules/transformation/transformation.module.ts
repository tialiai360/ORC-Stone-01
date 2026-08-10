import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransformationEntity } from './entity/transformation.entity';
import { TransformationController } from './transformation.controller';
import {
  TRANSFORMATION_REPOSITORY,
  TransformationService,
} from './transformation.service';
import { InMemoryTransformationRepository } from './repository/in-memory-transformation.repository';
import { TypeOrmTransformationRepository } from './repository/typeorm-transformation.repository';

const memoryTransformations = new InMemoryTransformationRepository();

@Module({})
export class TransformationModule {
  static forRoot(mode: 'postgres' | 'memory' = 'postgres'): DynamicModule {
    if (mode === 'memory') {
      return {
        module: TransformationModule,
        controllers: [TransformationController],
        providers: [
          { provide: TRANSFORMATION_REPOSITORY, useValue: memoryTransformations },
          TransformationService,
        ],
        exports: [TransformationService, TRANSFORMATION_REPOSITORY],
      };
    }

    return {
      module: TransformationModule,
      imports: [TypeOrmModule.forFeature([TransformationEntity])],
      controllers: [TransformationController],
      providers: [
        TypeOrmTransformationRepository,
        {
          provide: TRANSFORMATION_REPOSITORY,
          useExisting: TypeOrmTransformationRepository,
        },
        TransformationService,
      ],
      exports: [TransformationService, TRANSFORMATION_REPOSITORY],
    };
  }
}
