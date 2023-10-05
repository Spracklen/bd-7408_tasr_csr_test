const fs = require('fs');
const {Kafka, Partitioners} = require('kafkajs');
const {default: TasrClient} = require('tmg-tasr');
const {SchemaRegistry, SchemaType} = require('@kafkajs/confluent-schema-registry');

const {schema, referenceSchemas} = require('./etc/schemas/producerservice');

const name = 'tmg-kafka-csr-producer-framework-example';

const TYPE_OF_RUN = process.env.TYPE_OF_RUN || 'CSR';
const TOPIC_TO_PUBLISH_TO_CSR = process.env.CSR_TOPIC || 'upsolver_csr_test';
const TOPIC_TO_PUBLISH_TO_TASR = process.env.TASR_TOPIC || 'upsolver_combined_test';

const SASL_USERNAME = process.env.SASL_USERNAME;
const SASL_PASSWORD = process.env.SASL_PASSWORD;

console.info(`Our env is next 
                    TYPE_OF_RUN ${TYPE_OF_RUN} 
                    TOPIC_TO_PUBLISH_TO_CSR ${TOPIC_TO_PUBLISH_TO_CSR} 
                    TOPIC_TO_PUBLISH_TO_TASR ${TOPIC_TO_PUBLISH_TO_TASR}
                    v 3`);

// const TOPIC_TO_PUBLISH_TO_CSR = 'upsolver_csr_test';
// const TOPIC_TO_PUBLISH_TO_TASR = 'upsolver_combined_test';
const TASR_SCHEMA_VERSION = '8';

// ID of schema from ./csr/init.sh file
// const CSR_SCHEMA_ID = 1;

const PUBLISH_DATA = {
  "source__timestamp": 1695402137488,
  "source__agent": "PHP",
  "source__ip_address": "10.15.24.153",
  "page_view__request_uri": "/oauth/verify-session",
  "page_view__user_id": null,
  "page_view__session_id": "8c9v8jf1uhie2klidtef44jdd7",
  "page_view__ips": "35.165.32.121",
  "page_view__is_redirect": false,
  "page_view__guid": "BsYXMj8exN",
  "page_view__domain": "tagged.com",
  "page_view__browser_id": "E5FB7ACCB7DD1BC3",
  "meta__topic_name": "s_page_view",
  "meta__request_user_agent": "tagged/1883 (id=com.taggedapp; variant=release) android/33 (13) sns/6.16.4 (release) okhttp/4.10.0",
  "meta__request_session_id": "8c9v8jf1uhie2klidtef44jdd7",
  "meta__request_id": "62730B3969103D56795EBC4AE8F866CD",
  "meta__kvpairs": [
    {
      "key": "index_0",
      "value": "Android"
    }
  ],
  "meta__handlers": null
};

process.on('uncaughtException', (err) => {
  console.log(`${name} err_type=exception msg=${err.message} stack: ${err.stack}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, p) => {
  console.log(`${name} err_type=unhandled_rejection msg="Promise: ${p.name} reason: ${reason.message} stack: ${reason.stack}"`);
  process.exit(1);
});

async function run_flow() {

  const config = {
    brokers: ['odp-kafka-use1-kafka1.amz.odpprod.com:9094','odp-kafka-use1-kafka2.amz.odpprod.com:9094','odp-kafka-use1-kafka3.amz.odpprod.com:9094','odp-kafka-use1-kafka4.amz.odpprod.com:9094','odp-kafka-use1-kafka5.amz.odpprod.com:9094','odp-kafka-use1-kafka6.amz.odpprod.com:9094','odp-kafka-use1-kafka7.amz.odpprod.com:9094','odp-kafka-use1-kafka8.amz.odpprod.com:9094','odp-kafka-use1-kafka9.amz.odpprod.com:9094'],
    // brokers: ['regional-kafka-use1-kafka1.use1.amz.mtmeprod.com:9094','regional-kafka-use1-kafka2.use1.amz.mtmeprod.com:9094','regional-kafka-use1-kafka3.use1.amz.mtmeprod.com:9094','regional-kafka-use1-kafka4.use1.amz.mtmeprod.com:9094','regional-kafka-use1-kafka5.use1.amz.mtmeprod.com:9094','regional-kafka-use1-kafka6.use1.amz.mtmeprod.com:9094','regional-kafka-use1-kafka7.use1.amz.mtmeprod.com:9094'],
    // brokers: ['regional-kafka-usw2-kafka1.usw2.amz.mtmeprod.com:9092','regional-kafka-usw2-kafka2.usw2.amz.mtmeprod.com:9092','regional-kafka-usw2-kafka3.usw2.amz.mtmeprod.com:9092','regional-kafka-usw2-kafka4.usw2.amz.mtmeprod.com:9092','regional-kafka-usw2-kafka5.usw2.amz.mtmeprod.com:9092','regional-kafka-usw2-kafka6.usw2.amz.mtmeprod.com:9092','regional-kafka-usw2-kafka7.usw2.amz.mtmeprod.com:9092' ],
    tasrURL: 'https://tasr.use1.odpprod.com/tasr/subject',
    csrConfig: {
      url: 'https://api.confluent-schema-registry.arms.use1.amz.odpprod.com/'
    }
  };

// only grabbing the connection info for the first worker
  const {brokers, csrConfig, tasrURL} = config;
  const {url: csrURL} = csrConfig;

  console.info(`brokers ${brokers} and csrURL ${csrURL}`);

  const kafka = new Kafka({
    brokers,
    clientId: 'TestHandler1',
    sasl: {
      mechanism: 'scram-sha-512',
      username: SASL_USERNAME,
      password: SASL_PASSWORD
    },
    ssl: {
      ca: [fs.readFileSync('./ca-cert', 'utf-8')],
      rejectUnauthorized: false
    }
  });
  const admin = kafka.admin();
  const producer = kafka.producer({createPartitioner: Partitioners.LegacyPartitioner});

  await admin.connect();
  console.info('We have next topics:');
  console.info(`${await admin.listTopics()}`);

  await producer.connect();

//
// CSR
//

  if (TYPE_OF_RUN === 'CSR' || TYPE_OF_RUN === 'both') {

    const registry = new SchemaRegistry({host: csrURL});

    // Upload a schema to the registry
    const schema = `
  {"name": "PageView", "namespace": "tagged.events", "type": "record", "fields": [{"name": "source__timestamp", "type": "long"}, {"name": "source__agent", "type": "string"}, {"name": "source__ip_address", "type": "string"}, {"name": "page_view__request_uri", "type": "string"}, {"default": null, "name": "page_view__user_id", "type": ["null", "long"]}, {"name": "page_view__session_id", "type": "string"}, {"name": "page_view__ips", "type": "string"}, {"name": "page_view__is_redirect", "type": "boolean"}, {"name": "page_view__guid", "type": "string"}, {"default": null, "name": "page_view__domain", "type": ["null", "string"]}, {"default": null, "name": "page_view__browser_id", "type": ["null", "string"]}, {"default": null, "name": "meta__topic_name", "type": ["null", "string"]}, {"default": null, "name": "meta__request_user_agent", "type": ["null", "string"]}, {"default": null, "name": "meta__request_session_id", "type": ["null", "string"]}, {"default": null, "name": "meta__request_id", "type": ["null", "string"]}, {"default": null, "name": "meta__kvpairs", "type": ["null", {"default": null, "type": "map", "values": ["null", "string"]}]}, {"default": null, "name": "meta__handlers", "type": ["null", {"items": {"fields": [{"name": "timestamp", "type": "long"}, {"name": "agent", "type": "string"}, {"name": "ip_address", "type": "string"}], "name": "Handler", "namespace": "tagged.events", "type": "record"}, "type": "array"}]}]}
  `
    const { CSR_SCHEMA_ID } = await registry.register({
      type: SchemaType.AVRO,
      schema
    });

    const outgoingMessage = {
      key: TOPIC_TO_PUBLISH_TO_CSR,
      value: await registry.encode(CSR_SCHEMA_ID, PUBLISH_DATA),
    };

    await producer.send({
      topic: TOPIC_TO_PUBLISH_TO_CSR,
      messages: [outgoingMessage],
    });

    console.info(`CSR message have been sent to ${TOPIC_TO_PUBLISH_TO_CSR}`);

  }

//
// TASR
//

  if (TYPE_OF_RUN === 'TASR' || TYPE_OF_RUN === 'both') {

    const tasrClient = TasrClient.getInstance({tasrURL});

    PUBLISH_DATA.tmgtest__test = 'test_2';

    const avroSchema = await tasrClient
      .lookupSchemaByTopicAndVersion(TOPIC_TO_PUBLISH_TO_TASR, TASR_SCHEMA_VERSION);
    const encodedValue = avroSchema.toBuffer(PUBLISH_DATA);

    const outgoingMessageTasr = {
      key: 'key',
      value: encodedValue,
    };

    await producer.send({
      topic: TOPIC_TO_PUBLISH_TO_TASR,
      messages: [outgoingMessageTasr],
    });
    console.info('TASR message have been sent');

  }

  await producer.disconnect();

  process.exit(0);

}

run_flow();
