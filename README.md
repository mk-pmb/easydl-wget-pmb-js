
<!--#echo json="package.json" key="name" underline="=" -->
easydl-wget-pmb
===============
<!--/#echo -->

<!--#echo json="package.json" key="description" -->
Download files with my favorite options.
<!--/#echo -->


API
---

This module exports one function:

### easyDl(url, dest[, opts][, callback])

Returns a download context object `dlCtx`.
If a `callback` is provided, it is subscribed to `dlCtx.cb()`.
You may optionally provide an options object `opts`.

At least one subscriber should be added very soon after the context is
returned, or an `Error` will be thrown complaining that there's no
channel for reporting potential errors.
You can add more subscribers later. They will be notified as soon as the
download is finished, which might be immediately.
Subscribers that are interested in the file's content are called "readers".

__:TODO:__
readFile
However, if there are

__:TODO:__
easyDl then proceeds to try and acquire the file named `dest`.
If it already exists and is readable for the current user, that's a no-op.
Otherwise, it downloads `url` to a temporary file and if that succeeds,
renames it to `dest`.
If any readers were subscribed at the time the file is ready,
or the option `readFile` is truthy, it also reads the file.
Then it informs all subscribers that we're done.


### dlCtx.cb(nodeback)

Subscribe `nodeback` to be called with arguments __:TODO:__




Usage
-----

:TODO:



<!--#toc stop="scan" -->



Known issues
------------

* Needs more/better tests and docs.




&nbsp;


License
-------
<!--#echo json="package.json" key=".license" -->
ISC
<!--/#echo -->
