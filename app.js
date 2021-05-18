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

let currentDialCount = 0;
var DialTimerId = 0;


//Hook Switch
rpio.open(37, rpio.INPUT, rpio.PULL_UP);
rpio.poll(37, (pin) => {

	if(rpio.read(pin))
	{
		console.log('Hook Switch Disengaged ', pin, state);
	}
	else
	{
		console.log('Hook Switch Engaged ', pin, state);
	}

}, rpio.POLL_LOW);


//Dialer Engaged
rpio.open(35, rpio.INPUT, rpio.PULL_UP);
rpio.poll(35, (pin) => {

	if(rpio.read(pin))
	{
		console.log('Dialer Disengaged ', pin, state);
		DialTimerId = setInterval(() => {

		DialingCompleted(currentDialCount)

		}, 2000);
	}
	else
	{
		console.log('Dialer Engaged ', pin, state);
		clearInterval(DialTimerId);
		currentDialCount *= 10;
	}

}, rpio.POLL_LOW);


//Dialer tick
rpio.open(33, rpio.INPUT, rpio.PULL_UP);
rpio.poll(33, (pin) => {


	if(! rpio.read(pin))
	{
		currentDialCount++;
		console.log('Dial event on P%d (button currently %s)', pin, state);
	} 
	

}, rpio.POLL_LOW);

DialingCompleted = (value) => {

	console.log('Dial Value: ' + value);
	
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
	  break;
	}

	currentDialCount = 0;

}


DialingCompleted(01189998819991197253)
















