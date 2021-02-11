function transpose() {
    $("table").each(function() {
        var $this = $(this);
        var newrows = [];
        $this.find("tr").each(function(){
            var i = 0;
            $(this).find("td, th").each(function(){
                i++;
                if(newrows[i] === undefined) { newrows[i] = $("<tr></tr>"); }
                if(i == 1)
                    newrows[i].append("<th>" + this.innerHTML  + "</th>");
                else
                    newrows[i].append("<td>" + this.innerHTML  + "</td>");
            });
        });
        $this.find("tr").remove();
        $.each(newrows, function(){
            $this.append(this);
        });
    });
}

$(document).ready(function () {
    var old_width = $(window).width();
    if (old_width <= 768) transpose();
    $(window).resize(function() {
        var new_width = $(window).width();
        // Resizing to mobile
        if (new_width <= 768 && old_width > 768) {
            transpose()
        }
        // Resizing to tablet+
        else if ((new_width > 768 && old_width <= 768)) {
            transpose()
        }
        old_width = new_width;
    });
})