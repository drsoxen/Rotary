var express = require('express'),
    path = require('path'),
    bodyParser = require('body-parser'),
    cons = require('consolidate'),
    dust = require('dustjs-helpers'),
    app = express(),
    player = require('play-sound')(opts = {}),
    rpio = require('rpio');

app.engine('dust', cons.dust);


app.set('view engine', 'dust');
app.set('views', __dirname + '/views');

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));

app.get('/', (req, res) => {
  res.render('index');
});

app.listen(3000, () => {
  console.log('Server Started On Port 3000');

});


rpio.open(37, rpio.INPUT, rpio.PULL_UP);


rpio.poll(37, (pin) => {

	var state = rpio.read(cbpin) ? 'released' : 'pressed';
	console.log('Button event on P%d (button currently %s)', cbpin, state);

}, rpio.POLL_LOW);


setInterval(() => {

	console.log(Date.now());

}, 1000);


handsetUp = () => {

	//start assistant

}

handsetDown = () => {

	//end assistant

}

DialingStarted = () => {

	//end assistant

}

DialingCompleted = (value) => {


	switch(value) {
	  case 1:
	    break;
	  case 2:
	    break;
	  case 3:
	    break;
	  case 4:
	    break;
	  case 5:
	    break;
	  case 6:
	    break;
	  case 7:
	    break;
	  case 8:
	    break;
	  case 9:
	    break;
	  case 0:
	    break;
	  case 01189998819991197253:
	  	player.play('./public/audio/EmergencyServices.mp3')
	    break;

	  default:
	}

}




DialingCompleted(01189998819991197253)
















