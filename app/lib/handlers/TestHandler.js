/**
 * Handler for the example for tmg-kafka-consumer-framework
 */
class TestHandler {
  /**
   * Initialize this object
   *
   * @param {SimpleLogger} logger
   */
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Handle Message
   *
   * @param {object} message
   */
  async processMessage(message) {
    this.logger.debug(`processing message ${message}`);
  }
}

module.exports = TestHandler;
