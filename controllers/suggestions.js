exports.get_suggestions = function(req, res, next) {
  res.render('suggestions', { title: 'Your Suggestions' });
}

exports.post_suggestions = function(req, res, next) {
  console.log("Suggestions post received?");
}