# campaign-sparkpost
[![Build Status](https://travis-ci.org/SparkPost/campaign-sparkpost.svg?branch=master)](https://travis-ci.org/SparkPost/campaign-sparkpost)
[![Coverage Status](https://coveralls.io/repos/github/SparkPost/campaign-sparkpost/badge.svg?branch=master)](https://coveralls.io/github/SparkPost/campaign-sparkpost?branch=master)

SparkPost provider for [Campaign](https://github.com/bevacqua/campaign).

## Usage

```
var campaign = require('campaign');
var client = campaign({
  provider: require('campaign-sparkpost')({
    key: 'YOUR_API_KEY',
    campaign: 'my mailing'
  })
});
client.send(...) // as usual
```

## Options


### `options.key` 

Your SparkPost API key. If not included, `campaign-sparkpost` will attempt to use the `SPARKPOST_API_KEY`
environment variable.

### `options.num_rcpt_errors` 

(Optional) Defaults to 3. The total number of errors to return, there will be at most one error per recipient. Setting this
allows you to send large batches but not be overwhelmed by errors.


### `options.campaign` 

(Optional) Defaults to `model._template`. A SparkPost campaign to use when when sending. This can be used to search for mailings in SparkPost later.

## Tags

Campaign allows users to pass a `tags` array (defaults to `[model._template]`). If passed, the tags will be set on the 
SparkPost transmission `metadata` object under the `tags` key and on each recipient as `recipient.tags`. Recipients have a maximum of 10 tags, 
so only the first 10 are set. Transmission metadata will contain the full set of tags. The transmission metadata and 
recipient tags will be available in SparkPost webhook data.


## Merge Data

Any `provider.merge` data will be passed through to SparkPost. `provider.merge[*]` will be set as substitution data at the 
transmission level. Merge data for recipients (e.g., `provider.merge['email@example.com']`) will be set as substitution 
data for that recipient.

## License
MIT
