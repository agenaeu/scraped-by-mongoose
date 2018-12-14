// Grab the articles as a json
/* $("#scrape-articles").click(function () {
    $.ajax({
        method: "GET",
        url: "/scrape"
    })
    }); */
$("#get-articles").click(function () {
$.getJSON("/articles", function (data) {
    // For each one
    
    for (var i = 0; i < data.length; i++) {
        //console.log(data);
        // Display the apropos information on the page
        $("#articles").append(`<h3 class="articleClick" data-id= ${data[i]._id}> ${data[i].title}</h3> <a href="${data[i].link}">${data[i].link}</a>`);
        //$("#articles").append("<p data-id='" + data[i]._id + "'>" + data[i].title + "<br />" + data[i].link + "</p>");
        $("#articles").append(`<br><button data-id= ${data[i]._id} type="button" class="btn btn-primary">Comment</button><hr>`);
    }
});
});


// Whenever someone clicks a tag

$(document).on("click", ".btn-primary", function() {

    // Empty the notes from the note section
    $("#notes").empty();
    // Save the id from the p tag
    let thisId = $(this).attr("data-id");

    // Now make an ajax call for the Article
    $.ajax({
        method: "GET",
        url: "/articles/" + thisId
    })
        // With that done, add the note information to the page
        .then(function (data) {
            //console.log(data);

            // The title of the article
            $("#notes").append("<h2>" + data.title + "</h2>");
            // An input to enter a new title
            $("#notes").append("<input id='titleinput' name='title' >");
            // A textarea to add a new note body
            $("#notes").append("<textarea id='bodyinput' name='body'></textarea>");
            // A button to submit a new note, with the id of the article saved to it
            $("#notes").append("<button data-id='" + data._id + "' id='comment'>Comment</button>");
            $("#notes").append(
            `<div class="card" style="width: 18rem;">
                <div class="card-body"> 
                    <h5 class="card-title">${data.note.title}</h5>
                    <p class="card-text">${data.note.body}</p>
                </div>
             </div>`);
        

            // If there's a note in the article
            if (data.note) {
                //console.log(data.note);
                // Place the title of the note in the title input
                $(".card-title").val(data.note.title);
                // Place the body of the note in the body textarea
                $(".card-text").val(data.note.body);
            }
        });
});

// When you click the comment button
$(document).on("click", "#comment", function () {
    // Grab the id associated with the article from the submit button
    var thisId = $(this).attr("data-id");
    //console.log(thisId);

    // Run a POST request to change the note, using what's entered in the inputs
    $.ajax({
        method: "POST",
        url: "/articles/" + thisId,
        data: {
            // Value taken from title input
            title: $("#titleinput").val(),
            // Value taken from note textarea
            body: $("#bodyinput").val()
        }
    })
        // With that done
        .then(function (data) {
            // Log the response
            // console.log(data);
            // Empty the notes section
            $("#notes").empty();
        });

    // Also, remove the values entered in the input and textarea for note entry
    $("#titleinput").val("");
    $("#bodyinput").val("");
});
