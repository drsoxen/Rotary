var express = require('express'),
    path = require('path'),
    bodyParser = require('body-parser'),
    cons = require('consolidate'),
    dust = require('dustjs-helpers'),
    app = express(),
    player = require('play-sound')(opts = {}),
    rpio = require('rpio'),
    record = require('node-record-lpcm16'),
	Speaker = require('speaker'),
	GoogleAssistant = require('./index');

app.engine('dust', cons.dust);


app.set('view engine', 'dust');
app.set('views', __dirname + '/views');

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));

app.get('/', (req, res) => {
  res.render('index');
});

const config = {
  auth: {
    keyFilePath: path.resolve(__dirname, './public/auth/credentials.json'),
    savedTokensPath: path.resolve(__dirname, './public/auth/tokens.json'), // where you want the tokens to be saved
  },
  conversation: {
    audio: {
      sampleRateOut: 24000, // defaults to 24000
    },
    lang: 'en-US', // defaults to en-US, but try other ones, it's fun!
  },
};

const startConversation = (conversation) => {
  console.log('Say something!');
  let openMicAgain = false;
  let speaker;

  // setup the conversation
  conversation
    // send the audio buffer to the speaker
    .on('audio-data', (data) => {
    	if(!config.conversation.textQuery)
    	{
        	speaker.write(data, (err) => { /*speaker.end();*/ });
    	}
    })
    // done speaking, close the mic
    .on('end-of-utterance', () => record.stop())
    // just to spit out to the console what was said (as we say it)
    .on('transcription', data => console.log('Transcription:', data.transcription, ' --- Done:', data.done))
    // what the assistant said back
    .on('response', text => console.log('Assistant Text Response:', text))
    // if we've requested a volume level change, get the percentage of the new level
    .on('volume-percent', percent => console.log('New Volume Percent:', percent))
    // the device needs to complete an action
    .on('device-action', action => console.log('Device Action:', action))
    // once the conversation is ended, see if we need to follow up
    .on('ended', (error, continueConversation) => {
      if (error) console.log('Conversation Ended Error:', error);
      else if (continueConversation) openMicAgain = true;
      else 
      {
      	console.log('Conversation Complete');
      	//conversation.end();
      	if(config.conversation.textQuery)
      	{
      		delete config.conversation.textQuery;
      	}
  	  }
    })
    // catch any errors
    .on('error', (error) => {
      console.log('Conversation Error:', error);
    });

    if(!config.conversation.textQuery)
    {
	  const mic = record.start({ threshold: 0, recordProgram: 'arecord', device: 'plughw:1,0' });
	  mic.on('data', data => conversation.write(data));

	  speaker = new Speaker({
	    channels: 1,
	    sampleRate: config.conversation.audio.sampleRateOut,
	  });
	  speaker
	    .on('open', () => {
	      console.log('Assistant Speaking');
	    })
	    .on('close', () => {
	      console.log('Assistant Finished Speaking');
	      if (openMicAgain) assistant.start(config.conversation);
	    });
	}
};

app.listen(3000, () => {
  console.log('Server Started On Port 3000');

});

let totalDialCount = '';
let currentDialCount = 0;
let DialTimerId = 0;
let currentTime = 0;
let lastPin = 0;

let hookEngaged = true;
let dialerEngaged = false;


//Hook Switch
rpio.open(37, rpio.INPUT, rpio.PULL_UP);
rpio.poll(37, (pin) => {
	if(BounceDetected(pin)) return;

	if(rpio.read(pin))
	{
		if(!hookEngaged)
		{
			HookSwitchEngaged()
		}
	}
	else
	{
		if(hookEngaged)
		{
			HookSwitchDisengaged()
		}
	}
});

//Dialer Engaged
rpio.open(35, rpio.INPUT, rpio.PULL_UP);
rpio.poll(35, (pin) => {
	//if(hookEngaged) return;
	if(BounceDetected(pin)) return;
	if(rpio.read(pin))
	{
		if(dialerEngaged)
		{
			DialerDisengaged()
		}
	}
	else
	{
		if(!dialerEngaged)
		{
			DialerEngaged()
		}
	}
});

//Dialer tick
rpio.open(33, rpio.INPUT, rpio.PULL_UP);
rpio.poll(33, (pin) => {
	if(!dialerEngaged) return;
	if(rpio.read(pin)){
		if(BounceDetected(pin)) return;
		DialerTick()
	}
});

BounceDetected = (pin) =>{

	if (pin != lastPin){
		lastPin = pin;
		return false;
	}

	let millis = Date.now();
	let timeDiff = millis - currentTime;

	if(timeDiff < 50){
		console.log('Bounce Detected On Pin: ' + pin + ' Time: ' + timeDiff);
		return true;
	}
	currentTime = Date.now();

	return false;
}

HookSwitchEngaged = () => {
	console.log('Hook Switch Engaged');
	hookEngaged = true;
	totalDialCount = '';
}

HookSwitchDisengaged = () => {
	console.log('Hook Switch Disengaged');
	hookEngaged = false;

	config.conversation.isNew = true;

	// setup the assistant
	const assistant = new GoogleAssistant(config.auth);
	assistant
	  .on('ready', () => {
	    // start a conversation!
	    assistant.start(config.conversation);
	  })
	  .on('started', startConversation)
	  .on('error', (error) => {
	    console.log('Assistant Error:', error);
	  });
}

DialerEngaged = () => {
	console.log('Dialer Engaged');
	dialerEngaged = true;
	clearInterval(DialTimerId);	
}

DialerDisengaged = () => {
	console.log('Dialer Disengaged');
	dialerEngaged = false;

	DialTimerId = setInterval(() => {
		DialingCompleted(totalDialCount);
		clearInterval(DialTimerId);
		totalDialCount = '';
	}, 2000);

	if(currentDialCount == 10){
		currentDialCount = 0;
	}

	totalDialCount = totalDialCount + currentDialCount;
	currentDialCount = 0;
	console.log(totalDialCount);
}

DialerTick = () => {
	currentDialCount++;
	console.log('Dial event ' + currentDialCount);
}

DialingCompleted = (value) => {

	console.log('Dial Value: ' + value);
	
	switch(value) {
	  case '1':
	  	SendTextRequest('Set livingroom lights to 100%');
	    break;
	  case '2':
	    break;
	  case '3':
	    break;
	  case '4':
	    break;
	  case '5':
	  	SendTextRequest('Set livingroom lights to 50%');
	    break;
	  case '6':
	    break;
	  case '7':
	  	SendTextRequest('Set livingroom lights to 75%');
	    break;
	  case '8':
	    break;
	  case '9':
	    break;
	  case '0':
	  	player.play('./public/audio/DialTone.mp3')
	    break;
	  case '411':
	  	player.play('./public/audio/GeorgeCostanza.mp3')
	    break;
	  case '01189998819991197253':
	  	player.play('./public/audio/EmergencyServices.mp3')
	    break;

	  default:
	  break;
	}
}

SendTextRequest = (request) => {
	config.conversation.textQuery = request;
	config.conversation.isNew = true;
    
	const assistant = new GoogleAssistant(config.auth);
	assistant
	  .on('ready', () => {
	    // start a conversation!
	    assistant.start(config.conversation, startConversation);
	  })
	  .on('error', (error) => {
	    console.log('Assistant Error:', error);
	  });
}


//DialingCompleted(01189998819991197253)
















