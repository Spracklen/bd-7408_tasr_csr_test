// eslint-disable-next-line import/no-extraneous-dependencies
const { TMGConfig, DefaultConfigProvider, JSONSchemaValidator } = require('tmg-config');
// eslint-disable-next-line import/no-extraneous-dependencies
const { SimpleLogger: Logger } = require('meet-logger');

const { KafkaConsumerEngine } = require('../index');
const { schema, referenceSchemas } = require('./etc/schemas/consumerservice');
const TestHandler = require('./lib/handlers/TestHandler');
const Dependencies = require('./lib/Dependencies');

const name = 'tmg-kafka-consumer-framework-example';

const provider = new DefaultConfigProvider(name, process.env.ENVIRONMENT || 'local', `${__dirname}/etc/consumer`);
const validator = new JSONSchemaValidator(schema, referenceSchemas, { ajv: { useDefaults: true } });
const tmgConfig = new TMGConfig(provider, validator, { Logger });

tmgConfig.on('ready', async () => {
  const { logger, config } = tmgConfig;

  const dependencies = Dependencies.init({ tmgConfig, logger });
  const kafka = new KafkaConsumerEngine(config, dependencies);

  const testHandler = new TestHandler(logger);
  kafka.setHandler('TestHandler1', (message) => new Promise((resolve) => {
    testHandler.processMessage(message);
    resolve();
  }));
  kafka.start();
});

tmgConfig.on('error', (err) => {
  tmgConfig.logger.error(`${err.message}\nproperties: ${JSON.stringify(err.properties)}`);
});

process.on('uncaughtException', (err) => {
  tmgConfig.logger.error(`${name} err_type=exception msg=${err.message} stack: ${err.stack}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, p) => {
  tmgConfig.logger.error(`${name} err_type=unhandled_rejection msg="Promise: ${p.name} reason: ${reason.message} stack: ${reason.stack}"`);
  process.exit(1);
});
