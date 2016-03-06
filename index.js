'use strict';

var Sparkpost = require('sparkpost');
var _ = require('lodash');

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
      client.transmissions.send(getTransmissionsConfig(model, opts), done);
    }
  };

  function getTransmissionsConfig(model, configOpts) {
    var config = {
      transmissionBody: {
        content: {
          from: formatFrom(model),
          campaignId: _.get(configOpts, 'campaign', model._template),
          subject: model.subject,
          html: model.html
        },
        substitutionData: _.get(model.provider.merge, '*', {}),
        metadata:  {tags: _.get(model.provider, 'tags', [model._template])},
        recipients: formatRecipients(model)
      },
      num_rcpt_errors: configOpts.num_rcpt_errors
    };

    if (model.images.length) {
      config.transmissionBody.content.inline_images = formatImages(model);
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

  function formatImages(model) {
    return _.map(model.images, function(image) {
      return {
        type: image.mime,
        name: image.name,
        data: image.data
      };
    });
  }

  function formatRecipients(model) {
    var tags = _.cloneDeep(model.provider.tags) || [model._template];
    var to = model.to;

    // sparkpost allows a max of 10 tags per recipient
    tags = tags.splice(0, 10);

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
