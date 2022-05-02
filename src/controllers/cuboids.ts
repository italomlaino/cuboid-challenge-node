import { Request, Response } from 'express';
import * as HttpStatus from 'http-status-codes';
import { Id, Transaction } from 'objection';
import { Bag, Cuboid } from '../models';
import knex from '../db/knex';
import _ from 'lodash';

export const list = async (req: Request, res: Response): Promise<Response> => {
  const ids = req.query.ids as Id[];
  const cuboids = await Cuboid.query().findByIds(ids).withGraphFetched('bag');

  return res.status(200).json(cuboids);
};

export const get = async (req: Request, res: Response): Promise<Response> => {
  const id = req.params.id;
  const cuboid = await Cuboid.query().findById(id).withGraphFetched('bag');
  if (!cuboid) {
    return res.sendStatus(HttpStatus.NOT_FOUND);
  }

  return res.status(HttpStatus.OK).json(cuboid);
};

export const create = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { width, height, depth, bagId } = req.body;

  return await knex.transaction(async (trx: Transaction) => {
    const bag = await Bag.query(trx)
      .findById(bagId)
      .withGraphFetched('cuboids');

    if (_.isNil(bag)) {
      return res.sendStatus(HttpStatus.NOT_FOUND);
    }

    const volume = width * height * depth;
    if (volume > bag.availableVolume) {
      return res
        .status(HttpStatus.UNPROCESSABLE_ENTITY)
        .json({ message: 'Insufficient capacity in bag' });
    }

    const cuboid = await Cuboid.query(trx).insert({
      width,
      height,
      depth,
      bagId,
    });

    return res.status(HttpStatus.CREATED).json(cuboid);
  });
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const id = req.params.id;
  const { newWidth, newHeight, newDepth } = req.body;

  return await knex.transaction(async (trx: Transaction) => {
    const cuboid = await Cuboid.query(trx).findById(id).withGraphFetched('bag');

    if (_.isNil(cuboid)) {
      return res.sendStatus(HttpStatus.NOT_FOUND);
    }

    const bagAvailableVolumeWithoutCuboid =
      cuboid.bag.availableVolume + cuboid.volume;
    const newVolume = newWidth * newHeight * newDepth;
    if (newVolume > bagAvailableVolumeWithoutCuboid) {
      return res
        .status(HttpStatus.UNPROCESSABLE_ENTITY)
        .json({ message: 'Insufficient capacity in bag' });
    }

    const updatedCuboid = await cuboid
      .$query(trx)
      .patchAndFetch({
        width: newWidth,
        height: newHeight,
        depth: newDepth,
      })
      .withGraphFetched('bag');

    return res.status(HttpStatus.OK).json(updatedCuboid);
  });
};
