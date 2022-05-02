import {
  Id,
  ModelOptions,
  QueryContext,
  RelationMappings,
  Transaction,
} from 'objection';
import { Bag } from './Bag';
import Base from './Base';

export class Cuboid extends Base {
  id!: Id;
  width!: number;
  height!: number;
  depth!: number;
  bagId?: Id;
  bag!: Bag;
  volume!: number;

  async $beforeUpdate(
    opt: ModelOptions,
    queryContext: QueryContext
  ): Promise<void> {
    await super.$beforeUpdate(opt, queryContext);
    this.updateVolume();
  }

  async $beforeInsert(queryContext: QueryContext): Promise<void> {
    await super.$beforeInsert(queryContext);
    this.updateVolume();
  }

  updateVolume(): number {
    this.volume = this.width * this.height * this.depth;
    return this.volume;
  }

  async $afterDelete(queryContext: QueryContext): Promise<void> {
    await super.$afterDelete(queryContext);
    await this.updateBag(queryContext.transaction);
  }

  async $afterUpdate(
    opt: ModelOptions,
    queryContext: QueryContext
  ): Promise<void> {
    await super.$afterUpdate(opt, queryContext);
    await this.updateBag(queryContext.transaction);
  }

  async $afterInsert(queryContext: QueryContext): Promise<void> {
    await super.$afterInsert(queryContext);
    await this.updateBag(queryContext.transaction);
  }

  private async updateBag(trx: Transaction) {
    const bag = (await Bag.query(trx)
      .findById(this.bagId as Id)
      .forUpdate()
      .withGraphFetched('cuboids')) as Bag;
    bag.updateVolume();
    await bag.$query(trx).update();
  }

  static tableName = 'cuboids';

  static get relationMappings(): RelationMappings {
    return {
      bag: {
        relation: Base.BelongsToOneRelation,
        modelClass: 'Bag',
        join: {
          from: 'cuboids.bagId',
          to: 'bags.id',
        },
      },
    };
  }
}

export default Cuboid;
