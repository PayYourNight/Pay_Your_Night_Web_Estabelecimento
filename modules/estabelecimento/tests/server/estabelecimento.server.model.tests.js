/* eslint-disable */
'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
  mongoose = require('mongoose'),  
  Estabelecimento = mongoose.model('Estabelecimento');

/**
 * Globals
 */
var estabelecimento;

/**
 * Unit tests
 */
describe('Estabelecimento Model Unit Tests:', function () {
  beforeEach(function (done) {

    estabelecimento = new Estabelecimento({
      nome:'Estabelecimento 01',
      cnpj: '12646096000149'
    });

    //user = new User({
    //  firstName: 'Full',
    //  lastName: 'Name',
    //  displayName: 'Full Name',
    //  email: 'test@test.com',
    //  username: 'username',
    //  password: 'password'
    //});

    //user.save(function() {
    //  estabelecimento = new Estabelecimento({
    //    // Add model fields
    //    // ...
    //  });

    //  done();
    //});
  });

  describe('M�todo Salvar', function() {
    it('deve ser capaz de cadastrar um estabelecimento sem falhas', function (done) {
      return estabelecimento.save(function (err) {
        should.not.exist(err);
        done();
      });
    });
  });

  describe('M�todo Salvar', function () {
    it('N�o deve ser capaz de cadastrar um Estabelecimento sem o nome', function (done) {

      estabelecimento.nome = '';

      return estabelecimento.save(function (err) {
        should.exist(err);
        done();
      });
    });
  });

  describe('M�todo Salvar', function () {
    it('N�o deve ser capaz de cadastrar um Estabelecimento sem o CNPJ', function (done) {

      estabelecimento.cnpj = '';

      return estabelecimento.save(function (err) {
        should.exist(err);
        done();
      });
    });
  });


  afterEach(function (done) {
    Estabelecimento.remove().exec();   
    done();
  });
});