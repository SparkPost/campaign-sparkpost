# campaign-sparkpost
[![Build Status](https://travis-ci.org/SparkPost/campaign-sparkpost.svg?branch=master)](https://travis-ci.org/SparkPost/campaign-sparkpost)
[![Coverage Status](https://coveralls.io/repos/github/SparkPost/campaign-sparkpost/badge.svg?branch=master)](https://coveralls.io/github/SparkPost/campaign-sparkpost?branch=master)

SparkPost provider for [Campaign](https://github.com/bevacqua/campaign)

## NOTE

Inlined images aren't supported yet, so we haven't published this repo to NPM. Follow [this issue](https://github.com/SparkPost/campaign-sparkpost/issues/10)
to track when we have published to NPM.

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

Your SparkPost API key. If not included, `campaign-sparkpost` will attempt to use the `SPARKPOST_API_KEY
environment variable.

### `options.campaign` 

(Optional) A SparkPost campaign to use when when sending. This can be used to search for mailings in SparkPost later.

## Tags

Campaign allows users to pass a `tags` array (defaults to `[model._template]`). If passed, the tags will be set on the 
SparkPost transmission `metadata` object under the `tags` key and on each recipient. Recipients have a maximum of 10 tags, 
so on the first 10 are set. Transmission metadata will contain the full set of tags.


## Merge Data

Any `provider.merge` data will be passed through to SparkPost. `provider.merge[*]` will be set as substitution data at the 
transmission level. Merge data for recipients (e.g., `provider.merge['email@example.com']`) will be set as substitution 
data at the recipient level.

## License
MIT
