function errorHandling(data) {
    $(data.formid + ' a.btn-go').removeClass('disabled');
    $(data.formid + ' .errors').remove();
    $(data.formid + ' .has-error').removeClass('has-error');

    for(var i in data.errors) {
        $(data.formid + ' #' + data.errors[i].id ).parent().prepend('<p class="errors">' + data.errors[i].message + '</p>');
        $(data.formid + ' #' + data.errors[i].id ).parent().addClass('has-error');
    }
}

function removeErrors() {
    $(".form-group.has-error").each(function(){
        $(this).removeClass("has-error");
    });

    $(".errors").each(function(){
        $(this).remove();
    });
}

var registerform_response = function(data)
		{
		    if(data.success)
		    {
		        $("#login-submit").removeClass('disabled');
		        $("#profile-submit").removeClass('disabled');
		        window.loggedin = true;

				
		        var editing = false;
		        if(account && account.getprofile) editing = true;

		        $("#registerModal").removeClass("edit");

		        $("#registerModal .close").trigger("click");

		        $("body").addClass("loggedin");
				
				window.loginCheck();
				setTimeout(function() {
					var data = {user: account.getprofile};
					
		            trackprof = [data.user.id, data.user.role, data.user.subject, data.user.grades, 'Register'];
				     var trnames = ['uid', 'role', 'subject', 'grades'];
				     for(var i=1;i<=4;i++)
				        _gaq.push(['_setCustomVar', i, trnames[i-1], trackprof[i-1], 2]);
				    if(!editing)
		            	_gaq.push(['_trackEvent', 'Account', trackprof[4]]);
		            	
				}, 1000);

		    } else {
		        errorHandling(data);
		    }
		};
		

		

module.exports = {

		initRegisterModal: function()
		{
			// from /main.js
			var terms_click = function() { $('#register-submit').toggleClass('disabled', $("#terms:visible, #terms_reg:visible").length && !$("#terms:checked, #terms_reg:checked").length ) }; $('#terms, #terms_reg').click(terms_click); terms_click();
		
		    //login ajax
		    $('#login-submit').unbind("click");
		    $('#login-submit').click(function() {
		        if(!$(this).hasClass("disabled")) $(this).addClass('disabled');
		
		        if(!$("#loginModal .modal-content").hasClass("forgotpass")) {
		   			// login form is only forgot-pass form now
		        }else{
		            $.post( '/forgotpass', $('#loginform input').serialize(), function(data) {
		            	_gaq.push(['_trackEvent', 'Account', 'Forgot Password']);
		                if(data.success){
		                    $("#loginModal .modal-content").removeClass("forgotpass").addClass("forgotsent");
		                }
		                data.formid = '#loginform';
		
		                errorHandling(data);
		            }, "json" );
		        }
		        return false;
		    });


		    $('#register-submit').unbind("click");
		    $('#register-submit').click(function()
		    {
		    	if ($('#terms_reg').is(':checked'))
		    	{
		        	$(this).addClass('disabled');
		        	$.post('/register', $('#registerform input, #registerform select').serialize(), registerform_response, "json" );
		        }

		        return false;
		    });

		    $('#profile-submit').unbind("click");
		    $('#profile-submit').click(function()
		    {
		        $(this).addClass('disabled');
		        $.post('/edit-profile', $('#registerform input, #registerform select').serialize(), registerform_response, "json" );
		    });

		    $(".btn-go-inverse.editmode").click(function()
		    {
		        $("#registerModal .close").trigger("click");
		        return false;
		    });
		    
		    
		    // init_general
		    
		    $('#registerModal, #loginModal').on('shown.bs.modal', function() {  
		    	$(this).find('input').eq(0).focus(); 
		    });

		    $('#registerModal, #loginModal').on('hidden.bs.modal', function()
		    {
		        removeErrors();

		        //reset login
		        $("#loginModal .modal-content").removeClass("forgotpass").removeClass("forgotsent");

		        //reset register
		        $("#registerModal input[type!=checkbox], #registerModal textarea").val("");
		        $("#registerModal input[type=checkbox]").attr("checked", false);
		        $('#registerModal select').get(0).selectedIndex = 0;
		        $("#registerModal").removeClass("myacct").removeClass("editacct");
		    });
		    
		},
		
		

	bindEmailModal: function(id, url) {
	 	$("#email-submit").unbind('click').click(function(){
	 		_gaq.push(['_trackEvent', 'UI', 'Email']);
	 		
	 			var nl2br = function(s) {
					if(!s) return '';
					return s.replace("\n","<br>\n");
				}
	 		
			$.post( '/vocab-mail', { 'url': url, 'comments':nl2br($("#emailform textarea").val())+'<br>', 'copyme':$('#email_copyme:checked:visible').length, 'mailto': $("#emailform input").val() }, function() {}, "json" );
			
				$.post('/vocab-set-shared', {id:id}, function(response) {
					window.refreshSaved();
				});
				
			$("#emailform textarea, #emailform input:eq(0)").val('');
			
			$('.modal.in').modal('hide'); 
			
			$('<div class=modal><div class=modal-dialog><div class=modal-content><div class=modal-header><button type="button" class="close" data-dismiss="modal">&times;</button></div><h2>Your search has been sent.</h2></div></div></div>').modal();
			return false;
		});
	},

	bindExportModal: function(id, params) {
	    $(".pdfBtn, .rtfBtn").unbind('click').click(function(){
	        $(".pdfBtn, .rtfBtn").removeClass("selected");
	        $(this).addClass("selected");
	        
	        $('#export-submit').trigger('click');
	        
	        return false;
	    });
	    
	    $("#export-submit").unbind('click').click(function(){
	
					
	        if($(".pdfBtn").hasClass("selected")){
	            _gaq.push(['_trackEvent', 'Export', 'PDF']);
	
				var fn = ["Vocab Search", (new Date()).toLocaleDateString("en-us"), "Grade " + (params.grade)].join(" ").replace(/\//g,'-').replace(/[^A-Za-z0-9-]+/g, '_') + '.pdf';
				var loc = location.href;
				//if(!location.hash) loc += "#grade=" + globals.searchGrade + "&text=" + encodeURIComponent(globals.searchText);
				window.open('pdf2.php?url=' + encodeURIComponent(loc) + '&filename=' + encodeURIComponent(fn) );        	
	
				$('.modal:visible').modal('hide');
	
	        	//submitValues('pdf.php', params);
	            //window.open("pdf.php?text="+ encodeURIComponent(globals.searchText) + "&grade=" + globals.searchGrade + "&selectedGrade=" + JSON.stringify(globals.search_selectedGrade) + "&belowGrade=" + JSON.stringify(globals.search_belowGrade) + "&aboveGrade=" + JSON.stringify(globals.search_aboveGrade) + "&multipleMeanings=" + JSON.stringify(globals.search_multipleMeanings));
	
	        }else if($(".rtfBtn").hasClass("selected")) {
	            _gaq.push(['_trackEvent', 'Export', 'RTF']);
	            
				var submitValues = function(url, params) {
				    var form = [ '<form method="POST" target="_blank" action="', url, '">' ];
				
				    for(var key in params) 
				        form.push('<input type="hidden" name="', key, '" value="', _.escape(params[key]), '"/>');
				
				    form.push('</form>');
				
				    jQuery(form.join('')).appendTo('body')[0].submit();
				}
				
	            submitValues('rtf.php', params);
	            
	            $('.modal:visible').modal('hide');
				//window.open("rtf.php?text="+ encodeURIComponent(globals.searchText) + "&grade=" + globals.searchGrade + "&selectedGrade=" + JSON.stringify(globals.search_selectedGrade) + "&belowGrade=" + JSON.stringify(globals.search_belowGrade) + "&aboveGrade=" + JSON.stringify(globals.search_aboveGrade) + "&multipleMeanings=" + JSON.stringify(globals.search_multipleMeanings));
	
	        }else{
	            //show error
	        }
	
	
	        return false;
	    });
	
	},

	
	bindSaveModal: function(id) {
	    $("#save-submit").unbind('click').click(function(){
	        var saveobj = {
	            title:$("#saveform input:eq(0)").val(),
	            author:$("#saveform input:eq(1)").val(),
	            notes:$("#saveform textarea").val(),
	        };
	        var data = {
	            "formid": "#saveform",
	            "errors": [
	                {
	                    "id":"saveTitle",
	                    "message":"Title is required."
	                }
	            ]
	        };
	
	
	        if($("#saveform input").val().length == 0){
	            errorHandling(data);
	        } else if(!loggedin){
	            data.errors = []
	            errorHandling(data);
	            $('#saveform #saveTitle').parent().prepend('<p style="color:#DD3F3F;">You must be logged in to save.</p>');
	        }else{
	            $.post( 'api/update-search/'+id, saveobj, function(data){
	                if(data.success){
	                    _gaq.push(['_trackEvent', 'Search saved']);
	                    $("#saveModal .close").trigger("click");
	                    window.refreshSaved();
	                }else{
	                    alert("error");
	                }
	            }, "json" );
	        }
	        return false;
	    });
    }
    
}