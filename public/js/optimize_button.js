$(".add-label").click(function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    $(this).toggleClass("btn-info");
    $(this).toggleClass("btn-secondary");

    var changeText, checked_bool;
    if ($(this).hasClass("btn-info")) {
        changeText = "Add";
        checked_bool = true;
    }
    else {
        changeText = "Ignore";
        checked_bool = false;
    }
    $(this).contents().filter(function(){ return this.nodeType == 3; }).first().replaceWith(changeText);
    $(this).contents().filter(function(){ return this.nodeType != 3; }).first().prop("checked", checked_bool);
});

$(".remove-label").click(function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    $(this).toggleClass("btn-warning");
    $(this).toggleClass("btn-secondary");

    var changeText, checked_bool;
    if ($(this).hasClass("btn-warning")) {
        changeText = "Remove";
        checked_bool = true;
    }
    else {
        changeText = "Ignore";
        checked_bool = false;
    }
    
    $(this).contents().filter(function(){ return this.nodeType == 3; }).first().replaceWith(changeText);
    $(this).contents().filter(function(){ return this.nodeType != 3; }).first().prop("checked", checked_bool);
});

$(".keep-label").click(function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    $(this).toggleClass("btn-primary");
    $(this).toggleClass("btn-warning");

    var changeText, checked_bool;
    if ($(this).hasClass("btn-primary")) {
        changeText = "Keep";
        checked_bool = false;
    }
    else {
        changeText = "Remove";
        checked_bool = true;
    }
    
    $(this).contents().filter(function(){ return this.nodeType == 3; }).first().replaceWith(changeText);
    $(this).contents().filter(function(){ return this.nodeType != 3; }).first().prop("checked", checked_bool);
});