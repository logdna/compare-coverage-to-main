## compare-coverage-to-main

> Compares the current json coverage file to that of the latest release and
> provides a comment on pull requests with that information.

### What this tool does

* Fetches the latest release for the repository and pulls down the `coverage-summary.json` (Must be from the json-summary coverage reporter in istanbul)
* Compares it to the contents of the filepath passed in the `--coverage` flag.
* Posts a comment on the associated pull request

### Usage

```
compare-coverage-to-main - Tool to compare coverage for a PR with the main branch

  usage: compare-coverage-to-main -f <path to coverage file> -o <org> -r <repo> -p <pull request id>

  options:
    -h, --help                      show help and usage
    -v, --version                   show version
    -f, --coverage-filepath <path>  path to new coverage summary
    -d, --dry-run                   if true, does not post comment to PR
    -o, --owner <string>            the repository owner
    -p, --pr-id <number>            the PR id
    -r, --repo <repository name>    the repository name
```


## Authors

* [**Evan Lucas**](mailto:evanlucas@me.com) &lt;evanlucas@me.com&gt;

