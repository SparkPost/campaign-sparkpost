# campaign-sparkpost
SparkPost provider for [Campaign](https://github.com/bevacqua/campaign)

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
