'use strict';

var Sparkpost = require('sparkpost');
var _ = require('lodash');

// TODO provider .merge (recipient and transmission level substitution data)
// TODO images: attachments?

module.exports = function(options) {
  var client;
  var opts = _.defaults({}, options, {num_rcpt_errors: 3, key: process.env.SPARKPOST_API_KEY});

  if (!opts.key) {
    console.warn('campaign: SparkPost API key not set');
  }

  client = new Sparkpost(opts);

  return {
    name: 'sparkpost',
    send: function (model, done) {
      _.defaults(model, {provider: {}});
      client.transmissions.send(getTransmissionsConfig(model), done);
    }
  };

  function getTransmissionsConfig(model) {
    var config = {
      transmissionBody: {
        content: {
          from: formatFrom(model),
          campaignId: model._template,
          subject: model.subject,
          html: model.html
        },
        substitutionData: _.get(model.provider.merge, '*', {}),
        recipients: formatRecipients(model)
      },
      num_rcpt_errors: opts.num_rcpt_errors
    };

    if (model.provider.tags) {
      config.transmissionBody.metadata = {tags: model.provider.tags};
    }

    return config;
  }

  function formatFrom(model) {
    var from = model.from;

    if (model.social && model.social.name) {
      from = model.social.name + ' <' + model.from + '>';
    }

    return from;
  }

  function formatRecipients(model) {
    var tags = model.provider.tags || [model._template];
    var to = model.to;

    // sparkpost allows a max of 10 tags per recipient
    tags.splice(0, 10);

    if (!Array.isArray(to)) {
      to = [to];
    }

    // to is an array of email addresses
    return _.map(to, function(recipient) {
      return {
        address: {
          email: recipient
        },
        tags: tags,
        substitutionData: _.get(model.provider.merge, recipient, {})
      };
    });
  }
};
