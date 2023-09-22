// eslint-disable-next-line import/no-unresolved
const { KafkaPublisher } = require('@themeetgroup/tmg-kafka-publisher');
// eslint-disable-next-line import/no-unresolved
const { SFXStatsHelper } = require('tmg-stats-helper');

// eslint-disable-next-line import/no-extraneous-dependencies
const { TMGConfig, DefaultConfigProvider, JSONSchemaValidator } = require('tmg-config');
// eslint-disable-next-line import/no-extraneous-dependencies
const { SimpleLogger: Logger } = require('meet-logger');
const { schema, referenceSchemas } = require('./etc/schemas/producerservice');

const name = 'tmg-kafka-csr-producer-framework-example';

const provider = new DefaultConfigProvider(name, process.env.ENVIRONMENT || 'local', `${__dirname}/etc/producer`);
const validator = new JSONSchemaValidator(schema, referenceSchemas, { ajv: { useDefaults: true } });
const tmgConfig = new TMGConfig(provider, validator, { Logger });

const publisherName = 'regionalODP';
const TOPIC_TO_PUBLISH_TO = 's_tmg_test_1';
const TOPIC_VERSION = '1';

const now = Date.now();
const PUBLISH_DATA = {
  common__timestamp: now,
  common__subject: 'testsubject1',
  common__network: 'meetme',
  tmgtest__test: 'Dwight Schrute',
};

/**
 * Returns a new instance of SFXStatsHelper
 *
 * @param {object} config
 * @param {string} service
 * @param {SimpleLogger} logger
 * @returns {SFXStatsHelper}
 */
const getStatsHelper = (config, service, logger) => new SFXStatsHelper(
  config,
  service,
  { logger },
);

tmgConfig.on('ready', async () => {
  const { logger } = tmgConfig;

  const statsHelper = await tmgConfig.proxy(
    async (newConfig) => getStatsHelper(newConfig, name, logger),
    'signalfx',
    'SFXStatsHelper',
  );
  const kafkaPublisher = await tmgConfig.proxy(
    async (newConfig) => KafkaPublisher.getConnectedInstance(
      newConfig,
      { logger, statsHelper },
      publisherName,
    ),
    'kafkaPublisher',
    'KafkaPublisher',
    async (oldPublisher) => oldPublisher.disconnect(),
  );

  const message = KafkaPublisher.getFormattedKafkaMessageObject(PUBLISH_DATA);
  try {
    await kafkaPublisher.publish(TOPIC_TO_PUBLISH_TO, TOPIC_VERSION, message);
  } catch (err) {
    logger.error('Error publishing message to kafka', err);
  }

  logger.info(`CSR message have been sent to ${TOPIC_TO_PUBLISH_TO}`);

  await kafkaPublisher.disconnect();

  process.exit(0);
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
