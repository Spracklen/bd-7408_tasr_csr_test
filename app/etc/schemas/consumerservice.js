// purposefully ignore importing from dev dependencies because this is an example
// eslint-disable-next-line import/no-extraneous-dependencies
const { DefaultConfigProvider } = require('tmg-config');
// eslint-disable-next-line import/no-extraneous-dependencies
const { schema: LoggerSchema } = require('meet-logger');
const { schema: KafkaConsumerSchema } = require('../../../index');

exports.referenceSchemas = [
  LoggerSchema,
  KafkaConsumerSchema,
  ...DefaultConfigProvider.getSchemas(),
];

exports.schema = {
  $id: 'https://www.themeetgroup.com/tmg-kafka-consumer-framework-example/service.json',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Configuration for tmg-kafka-consumer-framework example',
  description: '',
  type: 'object',
  properties: {
    logger: {
      $ref: 'https://www.themeetgroup.com/meet-logger/simple-logger.json#/definitions/SimpleLogger',
    },
    consul: {
      $ref: 'https://www.themeetgroup.com/tmg-config/default-config-provider.json#/definitions/consul',
    },
    kafkaWorkers: {
      $ref: 'https://www.themeetgroup.com/tmg-kafka-consumer-framework/configuration.json#/definitions/kafkaWorkers',
    },
    kafkaConnections: {
      $ref: 'https://www.themeetgroup.com/tmg-kafka-consumer-framework/configuration.json#/definitions/kafkaConnections',
    },
    tasrURL: {
      $ref: 'https://www.themeetgroup.com/tmg-kafka-consumer-framework/configuration.json#/definitions/tasrURL',
    },
  },
  required: ['logger', 'consul', 'kafkaWorkers', 'kafkaConnections', 'tasrURL'],
};
