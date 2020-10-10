# DAG Draw JS
A tool for drawing directed acyclic graphs forked from HiFi Draw JS https://github.com/Iain-S/HiFiDrawJS

#  Instructions are as per HiFi Draw JS

## Getting started
Very little is needed.  Everything to render the main page is straight JavaScript, CSS and html.  You should be able to clone the repo and run a webserver from the root directory.  If you have python, you can use this command to run a web server: 
    
    python3 -m http.server 8009

Then open a browser and navigate to:

    localhost:8009

## Testing
I'm sure this system could be improved upon, suggestions welcome.

### Unit Tests
For the unit tests, I flirted with jest and some other popular unit testing frameworks.  However, these all require Node.  There's nothing wrong with that but I wanted to keep things as simple as possible.  Unit tests are straightforward JavaScript functions, which print success or fail messages when you open:

    localhost:8009/unit_tests.html

### Functional Tests
The functional tests are written in python and use selenium.  I recommend installing Pipenv, using it to install the dependencies and then running this bash command:

    cd pyth && python3 functional_tests.py

I would like to speed these tests up but they work fine.

## Coding style
I love Python's PEP8.  I dislike the lack of a widely used JavaScript standard.  I try to be consistent with naming conventions but don't always succeed.  I use the Notepad++ JSLint plugin when working on Windows.  When working on Linux, I let PyCharm correct my JavaScript and Python.  I check html using [this w3 validator](https://validator.w3.org/nu/#textarea).

## Licence
The original HiFi Draw JS project is licensed under the GNU GPLv3 - see the [LICENCE.md](https://github.com/Iain-S/HiFiDrawJS/blob/master/LICENCE.txt) file for details.
 
This project is also licensed under the GNU GPLv3.