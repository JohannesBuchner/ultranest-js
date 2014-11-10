Nested Sampling for Javascript applications
============================================

I demonstrate how to build useful, interactive statistics tools
using model comparison between low-dimensional models and parameter estimation.

Features of the framework
--------------------------
* Web tools are **interactive**, the user can choose or enter data
* Web tools are **easily accessible**, the user does not have to compile or download anything (low setup cost) and can play with data without effort.
* With RadFriends / Nested Sampling (http://arxiv.org/abs/1407.5459) you do not need to worry about convergence, this is handled safely. 
* You can also do **parameter estimation** -- posterior samples are computed for you.
* *Beware*: RadFriends becomes inefficient for high-dimensional problems. 
  Depending on your specific problem, that may become limiting already at 5 dimensions. 
  This implementation is aimed for **simple, low-dimensional problems** (line fitting, comparing distributions)

About the demo
--------------------------
I show an application where the user can enter two data sets.
Two models are compared. In the first model, all data are generated from a normal distribution with unknown parameters (2 parameters).
In the second model, the two data sets are each generated from a normal distribution with unknown parameters (4 parameters).
After clicking the start button, the marginal likelihood (evidence, Z) of both models is computed,
and compared. Please take a look at the source files.

**Please fork and build your own application!**

Files
------

* twodist.html: HTML interface, with plotting
* js/worker.js: WebWorker interface
* js/problem2.js: Implementation of the likelihood and prior function 
* js/plot.js: Some plotting
* js/js_nested2.js: Generic Nested Sampling implementation using RadFriends


Author
-------
Some files are based on the BEST tool (http://www.sumsar.net/best_online/),
and are attributed appropriately.
Otherwise, the code is written by Johannes Buchner (C) 2014, and licensed under
AGPLv3 (see LICENSE file). If you require a different license, please contact me.


