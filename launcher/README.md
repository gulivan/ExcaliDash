# localdraw

Launch the local-first [ExcaliDash](https://github.com/gulivan/ExcaliDash) desktop app:

```sh
npx localdraw
```

On an Apple silicon Mac, the command downloads the verified release on first run, installs it in `~/Applications`, and opens it. Later runs launch the installed app immediately.

The desktop application keeps its SQLite database on your computer and starts with authentication disabled. Linux, Windows, and Intel Mac installers will follow once those native builds are available.
