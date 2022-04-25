import { UserType } from './../../schemas/user';
import { HelperService } from './../helper/helper.service';
import { TransactionValueType } from './../../schemas/transactions';
import { ObjectId } from 'bson';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { Transaction } from '../../schemas/transactions';
import * as moment from 'moment';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel('Transactions') private readonly transactionsModel: Model<any>,
    @InjectModel('Users') private readonly usersModel: Model<any>,
    private helperService: HelperService,
  ) {}

  async getAllTransactions() {
    return await this.transactionsModel.aggregate([
      {
        $sort: {
          date: -1,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'debit_user',
          foreignField: '_id',
          as: '_debit_user',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'credit_user',
          foreignField: '_id',
          as: '_credit_user',
        },
      },
      {
        $addFields: {
          debit_user: {
            $cond: {
              if: {
                $not: ['$debit_user'],
              },
              then: 0,
              else: {
                $cond: {
                  if: {
                    $not: {
                      $arrayElemAt: ['$_debit_user', 0],
                    },
                  },
                  then: -1,
                  else: {
                    $arrayElemAt: ['$_debit_user', 0],
                  },
                },
              },
            },
          },
          credit_user: {
            $cond: {
              if: {
                $not: ['$credit_user'],
              },
              then: 0,
              else: {
                $cond: {
                  if: {
                    $not: {
                      $arrayElemAt: ['$_credit_user', 0],
                    },
                  },
                  then: -1,
                  else: {
                    $arrayElemAt: ['$_credit_user', 0],
                  },
                },
              },
            },
          },
        },
      },
      {
        $project: {
          'debit_user.password': 0,
          'credit_user.password': 0,
          _debit_user: 0,
          _credit_user: 0,
        },
      },
    ]);
  }

  async getAllTransactionsByPaginate(
    queryOption: any = {},
    search_key: any = {},
  ) {
    if (search_key.field === '' && search_key.value === '') {
      return await this.transactionsModel
        .aggregate([
          {
            $sort: {
              date: -1,
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'debit_user',
              foreignField: '_id',
              as: '_debit_user',
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'credit_user',
              foreignField: '_id',
              as: '_credit_user',
            },
          },
          {
            $addFields: {
              debit_user: {
                $cond: {
                  if: {
                    $not: ['$debit_user'],
                  },
                  then: 0,
                  else: {
                    $cond: {
                      if: {
                        $not: {
                          $arrayElemAt: ['$_debit_user', 0],
                        },
                      },
                      then: -1,
                      else: {
                        $arrayElemAt: ['$_debit_user', 0],
                      },
                    },
                  },
                },
              },
              credit_user: {
                $cond: {
                  if: {
                    $not: ['$credit_user'],
                  },
                  then: 0,
                  else: {
                    $cond: {
                      if: {
                        $not: {
                          $arrayElemAt: ['$_credit_user', 0],
                        },
                      },
                      then: -1,
                      else: {
                        $arrayElemAt: ['$_credit_user', 0],
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $project: {
              'debit_user.password': 0,
              'credit_user.password': 0,
              _debit_user: 0,
              _credit_user: 0,
            },
          },
        ])
        .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
        .limit(Number(queryOption.limit))
        .exec();
    } else {
      switch (search_key.field) {
        case 'Debit User': {
          return await this.transactionsModel
            .aggregate([
              {
                $sort: {
                  date: -1,
                },
              },
              {
                $lookup: {
                  from: 'users',
                  localField: 'debit_user',
                  foreignField: '_id',
                  as: '_debit_user',
                },
              },
              {
                $lookup: {
                  from: 'users',
                  localField: 'credit_user',
                  foreignField: '_id',
                  as: '_credit_user',
                },
              },
              {
                $addFields: {
                  debit_user: {
                    $cond: {
                      if: {
                        $not: ['$debit_user'],
                      },
                      then: 0,
                      else: {
                        $cond: {
                          if: {
                            $not: {
                              $arrayElemAt: ['$_debit_user', 0],
                            },
                          },
                          then: -1,
                          else: {
                            $arrayElemAt: ['$_debit_user', 0],
                          },
                        },
                      },
                    },
                  },
                  credit_user: {
                    $cond: {
                      if: {
                        $not: ['$credit_user'],
                      },
                      then: 0,
                      else: {
                        $cond: {
                          if: {
                            $not: {
                              $arrayElemAt: ['$_credit_user', 0],
                            },
                          },
                          then: -1,
                          else: {
                            $arrayElemAt: ['$_credit_user', 0],
                          },
                        },
                      },
                    },
                  },
                },
              },
              {
                $project: {
                  'debit_user.password': 0,
                  'credit_user.password': 0,
                  _debit_user: 0,
                  _credit_user: 0,
                },
              },
              {
                $match: {
                  'debit_user.name': {
                    $regex: search_key.value,
                    $options: 'i',
                  },
                },
              },
            ])
            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
            .limit(Number(queryOption.limit))
            .exec();
        }
        case 'Credit User': {
          return await this.transactionsModel
            .aggregate([
              {
                $sort: {
                  date: -1,
                },
              },
              {
                $lookup: {
                  from: 'users',
                  localField: 'debit_user',
                  foreignField: '_id',
                  as: '_debit_user',
                },
              },
              {
                $lookup: {
                  from: 'users',
                  localField: 'credit_user',
                  foreignField: '_id',
                  as: '_credit_user',
                },
              },
              {
                $addFields: {
                  debit_user: {
                    $cond: {
                      if: {
                        $not: ['$debit_user'],
                      },
                      then: 0,
                      else: {
                        $cond: {
                          if: {
                            $not: {
                              $arrayElemAt: ['$_debit_user', 0],
                            },
                          },
                          then: -1,
                          else: {
                            $arrayElemAt: ['$_debit_user', 0],
                          },
                        },
                      },
                    },
                  },
                  credit_user: {
                    $cond: {
                      if: {
                        $not: ['$credit_user'],
                      },
                      then: 0,
                      else: {
                        $cond: {
                          if: {
                            $not: {
                              $arrayElemAt: ['$_credit_user', 0],
                            },
                          },
                          then: -1,
                          else: {
                            $arrayElemAt: ['$_credit_user', 0],
                          },
                        },
                      },
                    },
                  },
                },
              },
              {
                $project: {
                  'debit_user.password': 0,
                  'credit_user.password': 0,
                  _debit_user: 0,
                  _credit_user: 0,
                },
              },
              {
                $match: {
                  'credit_user.name': {
                    $regex: search_key.value,
                    $options: 'i',
                  },
                },
              },
            ])
            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
            .limit(Number(queryOption.limit))
            .exec();
        }
        case 'Both': {
          return await this.transactionsModel
            .aggregate([
              {
                $sort: {
                  date: -1,
                },
              },
              {
                $lookup: {
                  from: 'users',
                  localField: 'debit_user',
                  foreignField: '_id',
                  as: '_debit_user',
                },
              },
              {
                $lookup: {
                  from: 'users',
                  localField: 'credit_user',
                  foreignField: '_id',
                  as: '_credit_user',
                },
              },
              {
                $addFields: {
                  debit_user: {
                    $cond: {
                      if: {
                        $not: ['$debit_user'],
                      },
                      then: 0,
                      else: {
                        $cond: {
                          if: {
                            $not: {
                              $arrayElemAt: ['$_debit_user', 0],
                            },
                          },
                          then: -1,
                          else: {
                            $arrayElemAt: ['$_debit_user', 0],
                          },
                        },
                      },
                    },
                  },
                  credit_user: {
                    $cond: {
                      if: {
                        $not: ['$credit_user'],
                      },
                      then: 0,
                      else: {
                        $cond: {
                          if: {
                            $not: {
                              $arrayElemAt: ['$_credit_user', 0],
                            },
                          },
                          then: -1,
                          else: {
                            $arrayElemAt: ['$_credit_user', 0],
                          },
                        },
                      },
                    },
                  },
                },
              },
              {
                $project: {
                  'debit_user.password': 0,
                  'credit_user.password': 0,
                  _debit_user: 0,
                  _credit_user: 0,
                },
              },
              {
                $match: {
                  $or: [
                    {
                      'debit_user.name': {
                        $regex: search_key.value,
                        $options: 'i',
                      },
                    },
                    {
                      'credit_user.name': {
                        $regex: search_key.value,
                        $options: 'i',
                      },
                    },
                  ],
                },
              },
            ])
            .skip((Number(queryOption.offset) - 1) * Number(queryOption.limit))
            .limit(Number(queryOption.limit))
            .exec();
        }
      }
    }
  }

  async getAllNumberOfTransactions(search_key: any = {}) {
    if (search_key.field === '' && search_key.value === '') {
     
      return await this.transactionsModel.countDocuments();
    } else {
      switch (search_key.field) {
        case 'Debit User': {
          const result = await this.transactionsModel.aggregate([           
            {
              $lookup: {
                from: 'users',
                localField: 'debit_user',
                foreignField: '_id',
                as: '_debit_user',
              },
            }, 
            {
              $addFields: {
                debit_user: {
                  $cond: {
                    if: {
                      $not: ['$debit_user'],
                    },
                    then: 0,
                    else: {
                      $cond: {
                        if: {
                          $not: {
                            $arrayElemAt: ['$_debit_user', 0],
                          },
                        },
                        then: -1,
                        else: {
                          $arrayElemAt: ['$_debit_user', 0],
                        },
                      },
                    },
                  },
                },            
              },
            },           
            {
              $match: {
                'debit_user.name': {
                  $regex: search_key.value,
                  $options: 'i',
                },
              },
            },
          ]);
          return result.length;
        }
        case 'Credit User': {
          const result = await this.transactionsModel.aggregate([           
    
            {
              $lookup: {
                from: 'users',
                localField: 'credit_user',
                foreignField: '_id',
                as: '_credit_user',
              },
            },
            {
              $addFields: {               
                credit_user: {
                  $cond: {
                    if: {
                      $not: ['$credit_user'],
                    },
                    then: 0,
                    else: {
                      $cond: {
                        if: {
                          $not: {
                            $arrayElemAt: ['$_credit_user', 0],
                          },
                        },
                        then: -1,
                        else: {
                          $arrayElemAt: ['$_credit_user', 0],
                        },
                      },
                    },
                  },
                },
              },
            },           
            {
              $match: {
                'credit_user.name': {
                  $regex: search_key.value,
                  $options: 'i',
                },
              },
            },
          ]);    
          return result.length;
        }
        case 'Both': {
          const result = await this.transactionsModel.aggregate([            
            {
              $lookup: {
                from: 'users',
                localField: 'debit_user',
                foreignField: '_id',
                as: '_debit_user',
              },
            },
            {
              $lookup: {
                from: 'users',
                localField: 'credit_user',
                foreignField: '_id',
                as: '_credit_user',
              },
            },
            {
              $addFields: {
                debit_user: {
                  $cond: {
                    if: {
                      $not: ['$debit_user'],
                    },
                    then: 0,
                    else: {
                      $cond: {
                        if: {
                          $not: {
                            $arrayElemAt: ['$_debit_user', 0],
                          },
                        },
                        then: -1,
                        else: {
                          $arrayElemAt: ['$_debit_user', 0],
                        },
                      },
                    },
                  },
                },
                credit_user: {
                  $cond: {
                    if: {
                      $not: ['$credit_user'],
                    },
                    then: 0,
                    else: {
                      $cond: {
                        if: {
                          $not: {
                            $arrayElemAt: ['$_credit_user', 0],
                          },
                        },
                        then: -1,
                        else: {
                          $arrayElemAt: ['$_credit_user', 0],
                        },
                      },
                    },
                  },
                },
              },
            },    
            {
              $match: {
                $or: [
                  {
                    'debit_user.name': {
                      $regex: search_key.value,
                      $options: 'i',
                    },
                  },
                  {
                    'credit_user.name': {
                      $regex: search_key.value,
                      $options: 'i',
                    },
                  },
                ],
              },
            },
          ]);
          return result.length;
        }
      }
    }
  }

  async createTransaction(transaction: Transaction, membership = false, free_balance =0) {// free_balace is user's getting free credits when register or cancel enrollment
    console.log('mm:' + membership); // check whether the package is membership
    transaction.date = moment().toISOString();
    transaction.auto_id = (await this.helperService.getNextSequenceValue(
      'transactions',
    )) as number;
    let used_free_credit = 0;   // used free credit in this transaction. if it biger than 0, means user spend free balance, else user get free balance
    transaction.debit_user = transaction.debit_user || null;
    transaction.credit_user = transaction.credit_user || null;    

    if (ObjectId.isValid(transaction.debit_user)) {
      const user = await this.usersModel.findById(transaction.debit_user);

      if (
        (user.type === UserType.Student &&
          transaction.debit_type === TransactionValueType.InternalCredit) ||
        (user.type === UserType.Teacher &&
          transaction.debit_type !== TransactionValueType.InternalCredit)
      ) {
        if (membership || user.free_balance == 0 || user.free_balance == null) {// if this is membership or freel balance is 0 or null then don't need reduce the free balance
          await this.usersModel.findByIdAndUpdate(
            user._id,
            {
              $inc: {
                balance: -transaction.debit_amount,
              },
            },
            { new: true },
          );
        } else {
          if (user.free_balance > transaction.debit_amount) { // if free balance is bigger than transaction amount then should reduce free balance
            used_free_credit = transaction.credit_amount
            await this.usersModel.findByIdAndUpdate(
              user._id,
              {
                $inc: {
                  balance: -transaction.debit_amount,
                  free_balance: -transaction.credit_amount,
                },
              },
              { new: true },
            );
          } else { // if free balance is smaller that debit amount then set free balance as zero
            used_free_credit = user.free_balance
            await this.usersModel.findByIdAndUpdate(
              user._id,
              {
                $inc: {
                  balance: -transaction.debit_amount,
                  free_balance: -user.free_balance,  // set zero
                },
              },
              { new: true },
            );
          }
        }
        // new:true will return updated user information
      }
    }

    if (ObjectId.isValid(transaction.credit_user)) {
      const user = await this.usersModel.findById(transaction.credit_user);

      if (
        (user.type === UserType.Student &&
          transaction.credit_type === TransactionValueType.InternalCredit) ||
        (user.type === UserType.Teacher &&
          transaction.credit_type !== TransactionValueType.InternalCredit)
      ) {
        used_free_credit = -free_balance
        await this.usersModel.findByIdAndUpdate(
          user._id,
          {
            $inc: {
              balance: transaction.credit_amount,
              free_balance: free_balance,
            },
          },
          { new: true },
        );
      }
    }
    transaction.free_credit = used_free_credit
    return await new this.transactionsModel(transaction).save();
  }

  async getAllTransactionsForUser(user: string) {
    return this.transactionsModel.aggregate([
      {
        $match: {
          $or: [
            {
              debit_user: new ObjectId(user),
            },
            {
              credit_user: new ObjectId(user),
            },
          ],
        },
      },
      {
        $sort: {
          date: -1,
        },
      },
    ]);
  }
  async getTransactionsByID(id: string){
    return await this.transactionsModel.findById(id);
  }
}
