var express = require('express');
const Transcoder = require("../Transcoder");
var router  = express.Router();

router.get('/video/:title.m3u8', function(req, res) {
	console.log(req.params.title + ".m3u8")

	//TODO: make it smarter
	//TODO: support multiple sessions

	killLastProcess(() => {
		const proc = new Transcoder({
			sessionId: shortid.generate(),
			videoPath: path.resolve(appConfig.moviesDir, movieUtils.titleToPath(req.params.title).path),
			publicDir: 'public',
			segmentTime: 5,
			segmentOffset: 0,
			minPartsForStream: 3,
			mrpas: 5, //MIN_READY_PARTS_AFTER_SEEK
			maxLiveParts: 15
		});

		proc.transcode(function(m3u8Content){
			res.send(m3u8Content);
		});
	});
});

module.exports = router;