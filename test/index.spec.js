// jshint expr:true
'use strict';

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru();
var _ = require('lodash');

chai.use(require('sinon-chai'));

describe('Campaign Sparkpost', function() {
  var campaignSparkpost;
  var sparkpostMock;
  var sparkpostClientMock;
  var recipient;
  var sendModel;
  var done;

  function getSpSendConfig() {
    return sparkpostClientMock.transmissions.send.args[0][0];
  }

  beforeEach(function() {
    sparkpostClientMock = {
      transmissions: {
        send: sinon.stub().yields(null)
      }
    };

    sparkpostMock = sinon.stub().returns(sparkpostClientMock);

    done = sinon.stub();

    recipient = 'lawyrup@saulgoodman.biz';

    sendModel = {
      to: recipient,
      from: 'walterwhite@jpwynnhs.gov',
      _template: 'default',
      subject: 'Better Call Saul',
      images: [],
      html: '<h1>Saul Goodman</h1><p>Call (505) 503-4455</p>'
    };

    campaignSparkpost = proxyquire('../index', {
      sparkpost: sparkpostMock
    });

  });

  it('should export a provider', function() {
    var provider = campaignSparkpost();

    expect(provider).to.have.keys(['name', 'send']);
    expect(provider.name).to.equal('sparkpost');
    expect(provider.send).to.be.a('function');
  });

  describe('API Key', function() {
    var key;
    var envKeyOrig;

    beforeEach(function() {
      key = '5055034455';
      envKeyOrig = process.env.SPARKPOST_API_KEY;
      sinon.spy(console, 'warn');
    });

    afterEach(function() {
      process.env.SPARKPOST_API_KEY = envKeyOrig;
      console.warn.restore();
    });

    it('should set an api key from config', function() {
      campaignSparkpost({key: key});
      expect(sparkpostMock.args[0][0].key).to.equal(key);
    });

    it('should set an api key from environment', function() {
      process.env.SPARKPOST_API_KEY = key;

      campaignSparkpost();
      expect(sparkpostMock.args[0][0].key).to.equal(key);
    });

    it('should log a warning if no api key is set', function() {
      delete process.env.SPARKPOST_API_KEY;

      campaignSparkpost();
      expect(console.warn).to.have.been.calledWith('campaign: SparkPost API key not set');
      expect(sparkpostMock.args[0][0].key).not.to.exist;
    });
  });

  describe('Sending', function() {
    var provider;

    beforeEach(function() {
      provider = campaignSparkpost();
    });

    it('should send a transmission to one recipient', function() {
      var sendCfg;
      var recipients;

      provider.send(sendModel, done);

      expect(sparkpostClientMock.transmissions.send).to.have.been.called;
      expect(done).to.have.been.called;

      sendCfg = getSpSendConfig();
      recipients = sendCfg.transmissionBody.recipients;

      expect(sendCfg.num_rcpt_errors).to.equal(3); // default
      expect(sendCfg.transmissionBody.content.from).to.equal(sendModel.from);
      expect(sendCfg.transmissionBody.content.campaignId).to.equal(sendModel._template);
      expect(sendCfg.transmissionBody.content.subject).to.equal(sendModel.subject);
      expect(sendCfg.transmissionBody.content.html).to.equal(sendModel.html);
      expect(sendCfg.transmissionBody.content.inline_images).not.to.exist;

      expect(sendCfg.transmissionBody.substitutionData).to.deep.equal({});
      expect(sendCfg.transmissionBody.metadata).to.deep.equal({tags: [sendModel._template]});

      expect(recipients).to.have.length(1);
      expect(recipients[0].address.email).to.deep.equal(sendModel.to);
      expect(recipients[0].tags).to.deep.equal([sendModel._template]);
      expect(recipients[0].substitutionData).to.deep.equal({});
    });

    it('should send a transmission to multiple recipients', function() {
      var recipients;

      sendModel.to = ['walterwhite@jpwynnhs.gov', 'jesse@capncook.info'];

      provider.send(sendModel, done);
      recipients = getSpSendConfig().transmissionBody.recipients;

      expect(recipients).to.have.length(2);

      _.forEach(recipients, function(recipient, index) {
        expect(recipient.address.email).to.deep.equal(sendModel.to[index]);
        expect(recipient.tags).to.deep.equal([sendModel._template]);
        expect(recipient.substitutionData).to.deep.equal({});
      });
    });

    it('should format from correctly', function() {
      var sendCfg;
      var expectedFrom;

      sendModel.social = {
        name: 'Walter White'
      };

      expectedFrom = sendModel.social.name + ' <' + sendModel.from + '>';

      provider.send(sendModel, done);
      sendCfg = getSpSendConfig();

      expect(sendCfg.transmissionBody.content.from).to.equal(expectedFrom);
    });

    it('should configure num_rcpt_errors', function() {
      sparkpostClientMock.transmissions.send.reset();

      provider = campaignSparkpost({num_rcpt_errors: 5});

      provider.send(sendModel, done);
      expect(getSpSendConfig().num_rcpt_errors).to.equal(5);
    });

    it('should be able to set sparkpost campaign', function() {
      var sendCfg;
      var spCampaign = 'ehrmantraut';

      sparkpostClientMock.transmissions.send.reset();

      provider = campaignSparkpost({campaign: spCampaign});
      provider.send(sendModel, done);
      sendCfg = getSpSendConfig();

      expect(sendCfg.transmissionBody.content.campaignId).to.equal(spCampaign);
    });

    it('should handle an error with sending', function() {
      var error = new Error('IAMTHEONEWHOKNOCKS');
      sparkpostClientMock.transmissions.send.yields(error);

      provider.send(sendModel, done);

      expect(done).to.have.been.calledWith(error);
    });
  });

  describe('Merge data', function() {
    var provider;

    beforeEach(function() {
      provider = campaignSparkpost();
    });

    it('should add * mergedata to transmission', function() {
      var sendCfg;
      var mergeData =  {
        whoyagonnacall: 'saul'
      };

      sendModel.provider = {
        merge: {
          '*': mergeData
        }
      };

      provider.send(sendModel, done);
      sendCfg = getSpSendConfig();

      expect(sendCfg.transmissionBody.substitutionData).to.equal(mergeData);
    });

    it('should add recipient metadata', function() {
      var recipients;
      var recipient = sendModel.to;
      var mergeData =  {
        whoyagonnacall: 'saul'
      };

      sendModel.provider = {merge: {}};
      sendModel.provider.merge[recipient] = mergeData;

      provider.send(sendModel, done);
      recipients = getSpSendConfig().transmissionBody.recipients;

      expect(recipients[0].substitutionData).to.equal(mergeData);
    });
  });

  describe('Tags', function() {
    var provider;

    beforeEach(function() {
      provider = campaignSparkpost();

      sendModel.provider = {
        tags: ['uno', 'mijo', 'nacho', 'hero', 'alpine shepard boy', 'five-o', 'bingo', 'rico', 'pimento', 'marco']
      };
    });

    it('should add tags', function() {
      var sendCfg;
      var recipients;

      // default tagging is tested above
      provider.send(sendModel, done);
      sendCfg = getSpSendConfig();
      recipients = sendCfg.transmissionBody.recipients;

      expect(sendCfg.transmissionBody.metadata.tags).to.deep.equal(sendModel.provider.tags);
      expect(recipients[0].tags).to.deep.equal(sendModel.provider.tags);
    });

    it('should only add 10 tags to recipients', function() {
      var sendCfg;
      var recipients;

      sendModel.provider.tags.push('switch');

      provider.send(sendModel, done);
      sendCfg = getSpSendConfig();
      recipients = sendCfg.transmissionBody.recipients;

      expect(sendCfg.transmissionBody.metadata.tags).to.deep.equal(sendModel.provider.tags);
      expect(recipients[0].tags).to.have.length(10);
      expect(_.includes(recipients[0].tags, 'switch')).to.be.false;
    });
  });

  describe('Images', function() {
    var provider;

    beforeEach(function() {
      sendModel.images = [{
        mime: 'image/png',
        data: 'YmV0dGVyY2FsbHNhdWw=',
        name: 'jimmymcgill'
      }];

      provider = campaignSparkpost();
    });

    it('should add images', function() {
      var sendCfg;
      var firstImage;

      provider.send(sendModel, done);
      sendCfg = getSpSendConfig();
      expect(sendCfg.transmissionBody.content.inline_images).to.be.an('array');
      expect(sendCfg.transmissionBody.content.inline_images).to.have.length(1);

      firstImage = sendCfg.transmissionBody.content.inline_images[0];
      expect(firstImage.type).to.equal(sendModel.images[0].mime);
      expect(firstImage.data).to.equal(sendModel.images[0].data);
      expect(firstImage.name).to.equal(sendModel.images[0].name);
    });
  });
});
