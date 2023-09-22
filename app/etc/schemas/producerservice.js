// purposefully ignore importing from dev dependencies because this is an example
// eslint-disable-next-line import/no-extraneous-dependencies
const { DefaultConfigProvider } = require('tmg-config');
// eslint-disable-next-line import/no-extraneous-dependencies
const { schema: LoggerSchema } = require('meet-logger');

exports.referenceSchemas = [
  LoggerSchema,
  ...DefaultConfigProvider.getSchemas(),
];

exports.schema = {
  $id: 'https://www.themeetgroup.com/tmg-kafka-consumer-framework-example/producer/service.json',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Configuration for tmg-kafka-consumer-framework producer example',
  description: '',
  type: 'object',
  properties: {
    logger: {
      $ref: 'https://www.themeetgroup.com/meet-logger/simple-logger.json#/definitions/SimpleLogger',
    },
    consul: {
      $ref: 'https://www.themeetgroup.com/tmg-config/default-config-provider.json#/definitions/consul',
    },
    brokers: {
      type: 'array',
      minItems: 1,
      uniqueItems: true,
      items: {
        type: 'string',
        minLength: 1,
      },
      examples: [
        'kafka:9092',
        'localhost:9092',
      ],
    },
    tasrURL: {
      type: 'string',
      description: 'tasr url',
      minLength: 1,
    },
  },
  required: ['logger', 'consul', 'brokers', 'tasrURL'],
};
