'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Checkin = mongoose.model('Checkin'),
  Consumo = mongoose.model('Consumo'),
  Estabelecimento = mongoose.model('Estabelecimento'),
  Usuario = mongoose.model('User'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash'),
  Transaction = require('mongoose-transactions');

/**
 * Create a Checkin
 */
exports.create = function (req, res) {
  
  var _userId = req.body.usuario_id;
  var _estabelecimentoId = req.body.estabelecimento_id;
  var _userRespId = req.body.usuarioresp_id;

  if (!mongoose.Types.ObjectId.isValid(_estabelecimentoId)) {
    return res.status(400).send({
      message: 'Estabelecimento não pode ser nulo'
    });
  }

  Checkin.findOne({
    usuario_id: new mongoose.Types.ObjectId(_userId),
    ativo: 'true'
  }, function (err, checkin) {
    if (checkin) {
      return res.status(422).send({
        message: 'Usuário possui um check-in ativo. '
      });
    } else {

      Estabelecimento.findById(_estabelecimentoId, function (err, est) {
        checkin = new Checkin(req.body);
        checkin.estabelecimento_id = est._id;
        checkin.estabelecimento_nome = est.nome;
        checkin.usuario_id = _userId;
        checkin.usuarioResp_id = _userRespId;

        var consumo = new Consumo({
          usuarioResp_id: _userRespId
        });

        start(checkin, consumo, res);
      });
    }
  });
};

async function start (checkin, consumo, res) {
  const transaction = new Transaction();
  try {
      var _id = transaction.insert('Checkin', checkin);      
      consumo.checkin_id = _id;
      transaction.insert('Consumo', consumo);
      const final = await transaction.run();
      res.json(checkin);
      // expect(final[0].name).toBe('Jonathan')
  } catch (error) {      
    const rollbackObj = await transaction.rollback().catch(console.error);
    transaction.clean();
    res.status(500)
      .send({
        message: errorHandler.getErrorMessage(error),
        status: 500
      });
  }
}

/**
 * Show the current Checkin
 */
exports.read = function (req, res) {
  // convert mongoose document to JSON
  var checkin = req.checkin ? req.checkin.toJSON() : {};

  // Add a custom field to the Article, for determining if the current User is the "owner".
  // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Article model.
  checkin.isCurrentUserOwner = !!(req.user && checkin.user && checkin.user._id.toString() === req.user._id.toString());

  res.json(checkin);
};

/**
 * Update a Checkin
 */
exports.update = function (req, res) {

};

/**
 * Delete an Checkin
 */
exports.delete = function (req, res) {

};

/**
 * List of Checkins
 */
exports.list = function (req, res) {
  Checkin.find()
    .sort('-created')
    .populate('usuario')
    .exec(function (err, checkin) {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        res.json(checkin);
      }
    });
};

exports.getAtivo = function (req, res) {
  var usuario_id = req.query.usuarioid;
  
  Checkin.findOne({ usuario_id: usuario_id, ativo: true }, function (err, checkin) {      
      if (err) {
        return res.status(500).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        if (!checkin) {
          return res.status(412).send({
            message: "Nenhum check-in localizado",
            status: 412
          });
        }
        else {          

          Estabelecimento.findById(new mongoose.Types.ObjectId(checkin.estabelecimento_id), function (err, est) {
            if (err) {
              return res.status(500).send({
                message: errorHandler.getErrorMessage(err)
              });
            } else {
              if (!est) {
                return res.status(412).send({
                  message: "Nenhum estabelecimento localizado",
                  status: 412
                });
              }
              else {
                res.json({
                  _id: checkin._id,
                  estabelecimento_id: checkin.estabelecimento_id,
                  estabeleciemento_nome: est.nome,
                  consumo_transferido: checkin.consumo_transferido,
                  consumos_incluidos: checkin.consumos_incluidos
                });
              }
            }
          });
        }
      }
    });
};

exports.getAguardandoConfirmacao = function (req, res) {
  var usuario_id = req.query.usuarioid;

  Checkin.findOne({ usuario_id: usuario_id, aguardandoCheckout: true }, function (err, checkin) {
    if (err) {
      return res.status(500).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      if (!checkin) {
        return res.status(404).send({
          message: "Nenhum check-in localizado"
        });
      }
      else {

        res.json(checkin);

      }
    }
  });
}

exports.checkinByID = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Check-in id is invalid'
    });
  }

  Checkin.findById(id).populate('user', 'displayName').exec(function (err, checkin) {
    if (err) {
      return next(err);
    } else if (!checkin) {
      return res.status(422).send({
        message: 'Nenhum check-in encontrado!'
      });
    }
    req.checkin = checkin;
    next();
  });
};
