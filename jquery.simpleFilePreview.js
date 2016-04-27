/* Copyright (c) 2012-2015 Jordan Kasper, 2015 eusonlito, 2015-2016 Alexei Ivashkevich
* Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
* Copyright notice and license must remain intact for legal use
* Requires: jQuery 1.9.1+
*           Bootstrap 3.3.4+ (for progressbar only)
*           jQuery UI 1.11.4+ (for dialog only)    
*           context.js 1.0.1 (for context menu only)
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, 
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF 
* MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS 
* BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN 
* ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN 
* CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 
* 
* Fore more usage documentation and examples, visit:
*          http://jordankasper.com/jquery
* 
* Basic usage (shown with defaults, except for "existingFiles"):
*  
<form ... enctype='multipart/form-data'>
...
<input type='file' name='upload' id='upload' multiple="multiple" />
...
</form>

var files = {"file_id": "file_name", ...};

$('input[type=file]').simpleFilePreview({
    'buttonContent': 'Add File',             // String HTML content for the button to add a new file
    'removeContent': 'X',                    // String HTML content for the removal icon shown on hover when a file is selected (or for existing files)
    'existingFiles': files,                  // array | object If an object, key is used in the remove hidden input (defaults to null)
    'shiftLeft': '&lt;&lt;',                 // String HTML content for the button to shift left for multiple file inputs
    'shiftRight': '&gt;&gt;',                // String HTML content for the button to shift right for multiple file inputs
    'iconPath': '',                          // String The path to the folder containing icon images (when a preview is unavailable) - should be absolute, but if relative, must be relative to the page the file input is on
    'defaultIcon': 'preview_file.png',       // String The file name to use for the defualt preview icon (when a proper file-type-specific icon cannot be found)
    'icons': {'png': 'preview_png.png', ...} // Object A mapping of file type (second half of mime type) to icon image file (used in combination with the "iconPath" option)
    'limit': 0,                              // Limit files on multiple option
    'removeMessage': {
        'prefix': 'Remove',                  // Prefix for remove message
        'stub': 'this file'                  // Stub instead of the file name for remove message
    },
    'radio': {                               // Display the radio buttons (if necessary) to mark one of the files (only multiple mode)
        'name': string,                      // Name of input element
        'checkedItem': string                // Preselect radio button
    },
    'readOnly': false,                       // Display with no possibility of modification
    'ajaxUpload': {                          // Upload file via AJAX
        'url': string,                       // URL for upload file
        'progressbar': false,                // Progressbar for upload file (required Bootstrap)
        'success': function (data, textStatus, jqXHR, inputFileElement),        // Callback for ajax success function
        'error': function (jqXHR, textStatus, errorThrown, inputFileElement),   // Callback for ajax error function
        'compose': function (formData)       // Callback for before send FormData customization
    },
    'beforeRemove': function (element),      // Callback for before remove element
    'removeDialog': {                        // Dialog for remove file (required jQuery UI)
        'id': string,                        // Dialog Id
        'title': string,                     // Title dialog
        'text': string,                      // Body text
        'ok': string,                        // Text for OK button
        'cancel': string,                    // Text for Cancel button
        'options': object                    // jQuery UI Dialog options
    },
    'contextMenu': {                         // Context menu for select file source
        'fileText': string,                  // Text for file option
        'linkText': string,                  // Text for link option
        'id': string,                        // Dialog Id
        'title': string,                     // Title dialog
        'text': string,                      // Body text
        'optionName': string,                // Name of input link to image or file
        'ok': string,                        // Text for OK button
        'cancel': string,                    // Text for Cancel button
        'inputName': string                  // Name of hidden input element
        'options': object                    // jQuery UI Dialog options
    },
    'parentSelector': string,                // Parent selector for component
});
* 
* TODO:
*   - add events for binding to various actions
*   - add example of html produced
* 
* REVISIONS:
*   0.1 Initial release
*   
*/
; (function ($) {
    'use strict';

    $.fn.simpleFilePreview = function (options) {
        if (!this || !this.length) {
            return this;
        }

        // Set up options (and defaults)
        options = options ? options : {};
        options = $.extend(true, {}, $.simpleFilePreview.defaults, options);

        // read only mode and radio button incompatible
        if (options.readOnly) {
            options.radio = null;
        }

        if (options.removeDialog) {
            if (!options.removeDialog.id) { options.removeDialog.id = $(this).id + '_remove_dialog'; }
            if (!options.removeDialog.title) { options.removeDialog.title = 'Remove'; }
            if (!options.removeDialog.text) { options.removeDialog.text = 'Are you sure?'; }
            if (!options.removeDialog.ok) { options.removeDialog.ok = 'Ok'; }
            if (!options.removeDialog.cancel) { options.removeDialog.cancel = 'Cancel'; }
            if (!options.removeDialog.options) { options.removeDialog.options = {}; }

            $('<div id="' + options.removeDialog.id + '" title="' + options.removeDialog.title + '"><p>' +
                '<span class="ui-icon ui-icon-alert"></span>' +
                options.removeDialog.text +
                '</p></div>').dialog($.extend({
                    autoOpen: false,
                    resizable: false,
                    modal: true
                }, options.removeDialog.options));
        }

        if (options.contextMenu) {
            if (!options.contextMenu.fileText) { options.contextMenu.fileText = 'Open file'; }
            if (!options.contextMenu.linkText) { options.contextMenu.linkText = 'Open link'; }
            if (!options.contextMenu.id) { options.contextMenu.id = $(this).id + '_openlink_dialog'; }
            if (!options.contextMenu.title) { options.contextMenu.title = 'Open link'; }
            if (!options.contextMenu.text) { options.contextMenu.text = 'Please enter link to file or image'; }
            if (!options.contextMenu.optionName) { options.contextMenu.optionName = 'Link'; }
            if (!options.contextMenu.ok) { options.contextMenu.ok = 'Ok'; }
            if (!options.contextMenu.cancel) { options.contextMenu.cancel = 'Cancel'; }
            if (!options.contextMenu.inputName) { options.contextMenu.inputName = 'input_openlink_dialog'; }
            if (!options.contextMenu.options) { options.contextMenu.options = {}; }

            var $gbody = $('body');
            var gbodyOverflow = $gbody.css('overflow');
            $('<div id="' + options.contextMenu.id + '" title="' + options.contextMenu.title + '"><p>' +
                options.contextMenu.text +
                '<form><fieldset>' +
                '<label for="' + options.contextMenu.id + '_link">' + options.contextMenu.optionName + '</label>' +
                '<input type="text" name="link" id="' + options.contextMenu.id + '_link" class="text ui-widget-content ui-corner-all">' +
                '</fieldset></form>' +
                '</p></div>').dialog($.extend({
                    autoOpen: false,
                    resizable: false,
                    modal: true,
                    position: { my: "center", at: "center", of: window },
                    open: function (event, ui) {
                        gbodyOverflow = $gbody.css('overflow');
                        $gbody.css('overflow', 'hidden');
                    },
                    close: function (event, ui) {
                        $gbody.css('overflow', gbodyOverflow);
                    },
                    buttons: [
                    {
                        text: options.contextMenu.ok,
                        click: function () {
                            var $element = $(((options.parentSelector) ? options.parentSelector : 'body') + ' li:has(a.simpleFilePreview_input:visible) input[name^="' + options.contextMenu.inputName + '"]');
                            var $link = $('#' + options.contextMenu.id + '_link');
                            $element.val($link.val());
                            fileProcess(options, $element, 'link');
                            $link.val("");
                            $(this).dialog("close");
                        }
                    }, {
                        text: options.contextMenu.cancel,
                        click: function () {
                            $(this).dialog("close");
                        }
                    }]
                }, options.contextMenu.options));

            var selector = ((options.parentSelector) ? options.parentSelector : 'body') + ' li:has(a.simpleFilePreview_input:visible)';
            context.init({ preventDoubleContext: false });
            context.settings({ compress: true });
            context.attach(selector, [
            {
                text: options.contextMenu.fileText,
                action: function (e) {
                    $(selector).find('.simpleFilePreview_input').trigger('click');
                }
            }, {
                text: options.contextMenu.linkText,
                action: function (e) {
                    openLinkDialog(e, options);
                }
            }]);
        }

        this.each(function () {
            setup($(this), options);
        });

        var $body = ((options.parentSelector) ? $(options.parentSelector + ' .simpleFilePreview_body') : $(this).closest('.simpleFilePreview_body'));

        // open file browser dialog on click of styled "button"
        $body.on('click', '.simpleFilePreview_input', function (e) {
            $(this).closest('.simpleFilePreview').find('input.simpleFilePreview_formInput').trigger('click');
            e.preventDefault();
        });

        // on click of the actual input (which is invisible), check to see if 
        // we need to clear the input (which is the default action for this plugin)
        $body.on('click', '.simpleFilePreview input.simpleFilePreview_formInput', function (e) {
            if (!$(this).val().length) {
                return this;
            }

            if (!options.readOnly) {
                $(this).closest('.simpleFilePreview').find('.simpleFilePreview_preview').trigger('click');
            }

            e.preventDefault();
        });

        // when file input changes, get file contents and show preview (if it's an image)
        $body.on('change', '.simpleFilePreview input.simpleFilePreview_formInput', function (e) {
            fileProcess(options, $(this), 'file');
        });

        // show or hide "remove" icon for file preview/icon
        $body.on('mouseover', '.simpleFilePreview_preview, .simpleFilePreview input.simpleFilePreview_formInput', function () {
            if (!options.readOnly) {
                var $parents = $(this).closest('.simpleFilePreview');

                if ($parents.find('.simpleFilePreview_preview').is(':visible')) {
                    $parents.find('.simpleFilePreview_remove').show();
                }
            }
        });

        $body.on('mouseout', '.simpleFilePreview_preview, .simpleFilePreview input.simpleFilePreview_formInput', function () {
            $(this).closest('.simpleFilePreview').find('.simpleFilePreview_remove').hide();
        })

        // remove file when preview/icon is clicked
        $body.on('click', '.simpleFilePreview_preview', function () {
            if (!options.readOnly) {
                var $pic = $(this);
                if (!options.removeDialog) {
                    remove($pic, options);
                } else {
                    var $dialog = $('#' + options.removeDialog.id);
                    $dialog.dialog('option',
                        'buttons', [{
                            text: options.removeDialog.ok,
                            click: function () {
                                remove($pic, options);
                                $(this).dialog("close");
                            }
                        }, {
                            text: options.removeDialog.cancel,
                            click: function () {
                                $(this).dialog("close");
                            }
                        }]);
                    $dialog.dialog("open");
                }
            }
        });

        // shift buttons for multi-selects
        $body.on('click', '.simpleFilePreview_shiftRight', function () {
            var ul = $(this).closest('.simpleFilePreview_multiUI').find('.simpleFilePreview_multi');
            var width = parseInt(ul.css('left')) + ul.width();

            if (width > ul.parent().width()) {
                var li = ul.find('li:first');
                ul.animate({
                    'left': '-=' + li.outerWidth(true)
                });
            }
        });

        $body.on('click', '.simpleFilePreview_shiftLeft', function () {
            var ul = $(this).closest('.simpleFilePreview_multiUI').find('.simpleFilePreview_multi');
            var left = parseInt(ul.css('left'));

            if (left < 0) {
                var width = ul.find('li:first').outerWidth(true);
                ul.animate({
                    'left': (((left + width) < 1) ? ('+=' + width) : 0)
                });
            }
        });

        // return node for fluid chain calling
        return this;
    };

    var remove = function ($this, options) {
        var $parents = $this.closest('.simpleFilePreview');

        if (options.beforeRemove != null) {
            options.beforeRemove($parents);
        }

        if ($parents.attr('data-sfpallowmultiple') == 1 && $parents.siblings('.simpleFilePreview').length) {
            if ($parents.hasClass('simpleFilePreview_existing')) {
                $parents.parent().append("<input type='hidden' id='" + $parents.attr('id') + "_remove' name='removeFiles[]' value='" + $parents.attr('data-sfprid') + "' />");
            }

            limit($this, options, 1);

            $parents.closest('.simpleFilePreview_multi').width('-=' + $parents.width());
            $parents.remove();

            return this;
        }

        // if it was an existing file, show file input and add "removeFiles" hidden input
        if ($parents.hasClass('simpleFilePreview_existing')) {
            $parents.find('input.simpleFilePreview_formInput').show();
            $parents.append("<input type='hidden' id='" + $parents.attr('id') + "_remove' name='removeFiles[]' value='" + $parents.attr('data-sfprid') + "' />");
            $parents.removeClass('simpleFilePreview_existing'); // no longer needed
        }

        limit($this, options, 1);

        // kill value in the input
        var $input = $parents.find('input.simpleFilePreview_formInput').val('');

        // Some browsers (*cough*IE*cough*) do not allow us to set val() 
        // on a file input, so we have to clone it without the value
        if ($input && $input.length && $input.val().length) {
            var attr = $input.get(0).attributes;
            var a = "";

            for (var j = 0, l = attr.length; j < l; ++j) {
                if (attr[j].name != 'value' && attr[j].name != 'title') {
                    a += attr[j].name + "='" + $input.attr(attr[j].name) + "' ";
                }
            }

            $input.before('<input "' + a + '" />');
            $input.remove();
        }

        // remove the preview element
        $this.remove();
        $parents.find('.simpleFilePreview_filename').remove();

        // show styled input "button"
        $parents.find('.simpleFilePreview_remove').hide().end()
            .find('.simpleFilePreview_input').show();
    };

    var limit = function ($this, options, add) {
        if (!options.limit) {
            return false;
        }

        var $files = $this.closest('.simpleFilePreview_multi').find('> li');
        add = add ? add : 0;

        if ($files.length > (options.limit + add)) {
            $files.last().hide();
        } else {
            $files.last().show();
        }
    };

    var setup = function (these, options) {
        var isMulti = these.is('[multiple]');

        // "multiple" removed because it's handled later manually
        these = these.removeAttr('multiple').addClass('simpleFilePreview_formInput');

        // multiple mode and radio button incompatible
        if (!isMulti) {
            options.radio = null;
        }

        // wrap input with necessary structure
        var $html = $("<" + (isMulti ? 'li' : 'div')
            + " id='simpleFilePreview_" + ($.simpleFilePreview.uid++) + "'"
            + " class='simpleFilePreview" + ((options.radio) ? " simpleFilePreview_withRadio" : "") + "' data-sfpallowmultiple='" + (isMulti ? 1 : 0) + "'>"
            + "<a class='simpleFilePreview_input'><span class='simpleFilePreview_inputButtonText'>"
            + options.buttonContent + "</span></a>"
            + "<span class='simpleFilePreview_remove'>" + options.removeContent + "</span>"
            + ((options.radio) ? "<input type='radio' class='simpleFilePreview_radio' name='" + options.radio.name + "' value='empty' />" : "")
            + ((options.ajaxUpload.progressbar) ? "<div class='progress simpleFilePreview_progress'><div class='progress-bar progress-bar-striped active' role='progressbar' aria-valuenow='0' aria-valuemin='0' aria-valuemax='100' style='width:0%'></div></div>" : "")
            + ((options.contextMenu) ? '<input type="hidden" name="' + options.contextMenu.inputName + '[' + $.simpleFilePreview.linkid + ']" />' : '')
            + "</" + (isMulti ? 'li' : 'div') + ">");

        these.before($html);
        $html.append(these);

        if (options.readOnly) {
            $html.hide();
        }

        // mostly for IE, the file input must be sized the same as the container, 
        // opacity 0, and z-indexed above other elements within the preview container
        these.css({
            width: ($html.width() + 'px'),
            height: (($html.height() - ((options.radio) ? 20 : 0)) + 'px')
        });

        // if it's a multi-select we use multiple separate inputs instead to support file preview
        if (isMulti) {
            $html.wrap("<div class='simpleFilePreview_multiUI simpleFilePreview_body'><div class='simpleFilePreview_multiClip'><ul class='simpleFilePreview_multi" + ((options.radio) ? " simpleFilePreview_withRadio" : "") + "'></ul></div></div>");
            $html.closest('.simpleFilePreview_multiUI')
                .prepend("<span class='simpleFilePreview_shiftRight simpleFilePreview_shifter'>" + options.shiftRight + "</span>")
                .append("<span class='simpleFilePreview_shiftLeft simpleFilePreview_shifter'>" + options.shiftLeft + "</span>");
        } else {
            $html.wrap("<div class='simpleFilePreview_body'></div>");
        }

        var exists = options.existingFiles;

        if (!exists) {
            if (isMulti) {
                $('.simpleFilePreview_multi').width($html.outerWidth(true) * $html.parent().find('.simpleFilePreview').length);
            }

            return these;
        }

        var exp = new RegExp("^(" + $.simpleFilePreview.previewFileTypes + ")$");

        if (isMulti) {
            // add all of the existing files to preview block
            var arr = ($.isArray(exists)) ? 1 : 0;

            for (var i in exists) {
                var ni = $.simpleFilePreview.uid++;
                var nn = $html.clone(true).attr('id', "simpleFilePreview_" + ni);

                if (options.contextMenu) {
                    nn.find('[name^="' + options.contextMenu.inputName + '"]').attr('name', options.contextMenu.inputName + '[' + ++$.simpleFilePreview.linkid + ']').val('');
                }

                nn.addClass('simpleFilePreview_existing')
                    .attr('data-sfprid', arr ? exists[i] : i)
                    .find('input.simpleFilePreview_formInput').remove();
                nn.show();

                $html.before(nn);

                var ext = getFileExt(exists[i]);
                ext = ext ? ext.toLowerCase() : null;

                if (ext && exp.test(ext)) {
                    addOrChangePreview(nn, exists[i], '', options);
                } else if (options.icons[ext]) {
                    addOrChangePreview(nn, options.icons[ext], getFilename(exists[i]), options);
                } else {
                    addOrChangePreview(nn, options.defaultIcon, getFilename(exists[i]), options);
                }

                if (options.radio) {
                    nn.find('input.simpleFilePreview_radio').val(nn.attr('data-sfprid'));
                }
            }

            $('.simpleFilePreview_multi').width($html.outerWidth(true) * $html.parent().find('.simpleFilePreview').length);

            if (options.radio) {
                $html.closest('.simpleFilePreview_multi').find("input[type='radio'][value='" + options.radio.checkedItem + "']").prop("checked", true);
            }

            return these;
        }

        // for single inputs we only take the last file
        var $file = null;
        var arr = $.isArray(exists) ? 1 : 0;

        for (var i in exists) {
            $file = {
                id: (arr ? exists[i] : i),
                file: exists[i]
            };
        }

        if (!$file) {
            return these;
        }

        // hide file input, will be shown if existing file is removed
        $html.attr('data-sfprid', $file['id'])
            .addClass('simpleFilePreview_existing')
            .find('input.simpleFilePreview_formInput').hide();

        var ext = getFileExt($file['file']);
        ext = ext ? ext.toLowerCase() : null;

        if (ext && exp.test(ext)) {
            addOrChangePreview($html, $file['file'], '', options);
        } else if (options.icons[ext]) {
            addOrChangePreview($html, options.icons[ext], getFilename($file['file']), options);
        } else {
            addOrChangePreview($html, options.defaultIcon, getFilename($file['file']), options);
        }

        return these;
    };

    var addOrChangePreview = function ($parents, src, filename, options) {
        filename = filename ? filename : null;
        src = ((new RegExp('^(http|https)://').test(src)) ? src : (((new RegExp('[/\\\\]')).test(src) ? '' : (options.iconPath)) + src));

        $parents.find('.simpleFilePreview_input').hide();

        var $image = $parents.find('.simpleFilePreview_preview');

        if ($image && $image.length) {
            $image.attr('src', src);
        } else {
            $parents.append("<img src='" + src + "'"
                + " class='simpleFilePreview_preview " + (filename ? 'simpleFilePreview_hasFilename' : '') + "'"
                + " alt='" + (filename ? filename : 'File Preview') + "'"
                + " title='" + options.removeMessage.prefix + ' ' + (filename ? filename : options.removeMessage.stub) + "' />");

            // for tooltips
            $parents.find('input.simpleFilePreview_formInput').attr('title', options.removeMessage.prefix + " " + (filename ? filename : options.removeMessage.stub));
        }

        limit($parents, options);

        if (!filename) {
            return null;
        }

        var $filename = $parents.find('.simpleFilePreview_filename');

        if ($filename && $filename.length) {
            $filename.text(filename);
        } else {
            $parents.append("<span class='simpleFilePreview_filename'>" + filename + "</span>")
                .find('.simpleFilePreview_filename');
        }
    };

    var getFilename = function ($parents) {
        var m = $parents.match(/[\/\\]([^\/\\]+)$/);

        if (m && m[1] && m[1].length) {
            return m[1];
        }

        return null;
    };

    var getFileExt = function ($parents) {
        var m = $parents.match(/[\.]([^\/\\\.]+)$/);

        if (m && m[1] && m[1].length) {
            return m[1];
        }

        return null;
    };

    var openLinkDialog = function (e, options) {
        window.scrollTo(0, 0);
        $('#' + options.contextMenu.id).dialog("open");
    };

    var fileProcess = function (options, $this, type) {
        if (!options.readOnly) {
            var _this = $this.get()[0];
            if (options.ajaxUpload) {
                var fd = new FormData();
                var cutNameToken = _this.name.indexOf('[');
                var value = ((type == 'file') ? _this.files[0] : ((type == 'link') ? $this.val() : ''));
                if (cutNameToken > -1) {
                    fd.append(_this.name.substr(0, cutNameToken), value);
                } else {
                    fd.append(_this.name, value);
                }

                if (options.ajaxUpload.compose) {
                    options.ajaxUpload.compose(fd);
                }

                if (options.ajaxUpload.progressbar) {
                    $this.parent().find('.simpleFilePreview_progress').show();
                }

                $.ajax({
                    url: options.ajaxUpload.url,
                    type: "POST",
                    data: fd,
                    dataType: 'json',
                    contentType: false,
                    processData: false,
                    success: function (data, textStatus, jqXHR) {
                        if (options.ajaxUpload.progressbar) {
                            $this.parent().find('.simpleFilePreview_progress').hide();
                        }
                        if (options.ajaxUpload.success) {
                            options.ajaxUpload.success(data, textStatus, jqXHR, _this);
                        }
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        if (options.ajaxUpload.progressbar) {
                            $this.parent().find('.simpleFilePreview_progress').hide();
                        }
                        if (options.ajaxUpload.error) {
                            options.ajaxUpload.error(jqXHR, textStatus, errorThrown, _this);
                        }
                    },
                    xhr: function () {
                        var xhr = new window.XMLHttpRequest();
                        //Upload progress
                        xhr.upload.addEventListener("progress", function (evt) {
                            if (evt.lengthComputable && options.ajaxUpload.progressbar) {
                                var percentComplete = evt.loaded * 100 / evt.total;
                                var progressbar = $this.parent().find('.simpleFilePreview_progress div');
                                progressbar.css({ width: percentComplete + '%' }).attr('aria-valuenow', percentComplete);
                            }
                        }, false);
                        return xhr;
                    }
                });
            }

            var $parents = $this.closest('.simpleFilePreview');

            // if it's a multi-select, add another selection box to the end
            // NOTE: this is done first since we clone the previous input
            // NOTE: the second check is there because IE 8 fires multiple change events for no good reason
            if (($parents.attr('data-sfpallowmultiple') == 1) && !$parents.find('.simpleFilePreview_preview').length) {
                var newId = $.simpleFilePreview.uid++;
                var $newN = $parents.clone(true).attr('id', "simpleFilePreview_" +newId);

                if (options.contextMenu) {
                    $newN.find('[name^="' + options.contextMenu.inputName + '"]').attr('name', options.contextMenu.inputName + '[' + ++$.simpleFilePreview.linkid + ']').val('');
                }

                if (options.ajaxUpload.progressbar) {
                    $newN.find('.simpleFilePreview_progress').hide();
                }

                $newN.find('input.simpleFilePreview_formInput')
                    .attr('id', $newN.find('input.simpleFilePreview_formInput').attr('id') + '_' + newId)
                    .attr('name', function (index, previousValue) {
                        var previousName = $parents.find('input.simpleFilePreview_formInput').attr('name');
                        var inputIndex = parseInt(previousName.substring(previousName.indexOf('[') + 1, previousName.indexOf(']')));
                        return (!isNaN(inputIndex)) ? previousName.substring(0, previousName.indexOf('[') + 1) + ++inputIndex + previousName.substring(previousName.indexOf(']')) : previousValue;
                    })
                    .val('');

                $parents.after($newN);

                var nw = $parents.closest('.simpleFilePreview_multi').width('+=' + $newN.outerWidth(true)).width();

                if (nw > $parents.closest('.simpleFilePreview_multiClip').width()) {
                    $parents.closest('.simpleFilePreview_multiUI').find('.simpleFilePreview_shiftRight').trigger('click');
                }
            }

            var ext = getFileExt(_this.value);
            ext = ext ? ext.toLowerCase(): null;

            if ((type == 'file') && _this.files && _this.files[0]) {
                var exp = new RegExp("^image\/(" + $.simpleFilePreview.previewFileTypes + ")$");

                if (exp.test(_this.files[0].type.toLowerCase()) && window.FileReader) {
                    // show preview of image file
                    var $FR = new FileReader();

                    $FR.onload = function (e) {
                        addOrChangePreview($parents, e.target.result, '', options);
                    };

                    $FR.readAsDataURL(_this.files[0]);
                } else {
                    // show icon if not an image upload
                    var m = _this.files[0].type.toLowerCase().match(/^\s*[^\/]+\/([a-zA-Z0-9\-\.]+)\s*$/);

                    if (m && m[1] && options.icons[m[1]]) {
                        addOrChangePreview($parents, options.icons[m[1]], getFilename(_this.value), options);
                    } else {
                        addOrChangePreview($parents, options.defaultIcon, getFilename(_this.value), options);
                    }
                }

                if (options.radio) {
                    $parents.find('input.simpleFilePreview_radio').val($parents.context.files[0].name);
                }

                return _this;
            }

            if (type == 'file') {
                // Any browser not supporting the File API (and FileReader)
                // Some versions of IE don't have real paths, and can't support
                // any other way to do file preview without uploading to the server
                // If a browser does report a valid path (IE or otherwise), then 
                // we'll try to get the file preview
                var exp = new RegExp("^(" +$.simpleFilePreview.previewFileTypes + ")$");

                if (ext && !(/fakepath/.test(_this.value.toLowerCase())) && exp.test(e)) {
                    // older versions of IE (and some other browsers) report the local 
                    // file path, so try to get a preview that way
                    addOrChangePreview($parents, "file://" +_this.value, '', options);
                } else {
                    // not an image (or using fakepath), so no preview anyway
                    if (options.icons[ext]) {
                        addOrChangePreview($parents, options.icons[ext], getFilename(_this.value), options);
                    } else {
                        addOrChangePreview($parents, options.defaultIcon, getFilename(_this.value), options);
                    }
                }
            }

            if (type == 'link') {
                var exp = new RegExp("^(" + $.simpleFilePreview.previewFileTypes + ")$");
                if (exp.test(ext)) {
                    addOrChangePreview($parents, $this.val(), '', options);
                } else {
                    addOrChangePreview($parents, _this.value, getFilename(_this.value), options);
                }
            }
        }
    };

    // Static properties
    $.simpleFilePreview = {
            defaults: {
            'buttonContent': 'Add File',
            'removeContent': 'X',
            'existingFiles': null, // array or object. if object, key is used in the remove hidden input
            'shiftLeft': '&lt;&lt;',
            'shiftRight': '&gt;&gt;',
            'iconPath': '',
            'defaultIcon': 'preview_file.png',
            'limit': 0,
            'removeMessage': {
                'prefix': 'Remove',
                'stub': 'this file',
            },
            'radio': null,
            'readOnly': false,
            'ajaxUpload': null,
            'beforeRemove': null,
            'removeDialog': null,
            'contextMenu': null,
            'parentSelector': null,
            'icons': {
                'png': 'preview_png.png',
                'gif': 'preview_png.png',
                'bmp': 'preview_png.png',
                'svg': 'preview_png.png',
                'jpg': 'preview_png.png',
                'jpeg': 'preview_png.png',
                'pjpg': 'preview_png.png',
                'pjpeg': 'preview_png.png',
                'tif': 'preview_png.png',
                'tiff': 'preview_png.png',
                'mp3': 'preview_mp3.png',
                'mp4': 'preview_mp3.png',
                'wav': 'preview_mp3.png',
                'wma': 'preview_mp3.png',
                'pdf': 'preview_pdf.png',
                'txt': 'preview_txt.png',
                'rtf': 'preview_txt.png',
                'text': 'preview_txt.png',
                'plain': 'preview_txt.png',
                'zip': 'preview_zip.png',
                'tgz': 'preview_zip.png',
                'x-rar-compressed': 'preview_zip.png',
                'octet-stream': 'preview_zip.png',
                'odf': 'preview_doc.png',
                'odt': 'preview_doc.png',
                'doc': 'preview_doc.png',
                'msword': 'preview_doc.png',
                'vnd.openxmlformats-officedocument.wordprocessingml.document': 'preview_doc.png',
                'docx': 'preview_doc.png',
                'ods': 'preview_xls.png',
                'vnd.ms-excel': 'preview_xls.png',
                'xls': 'preview_xls.png',
                'xlx': 'preview_xls.png',
                'msexcel': 'preview_xls.png',
                'x-excel': 'preview_xls.png',
                'x-ms-excel': 'preview_xls.png',
                'vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'preview_xls.png'
            }
        },
        uid: 0,
        linkid: 0,
        init: false,
        previewFileTypes: 'p?jpe?g|png|gif|bmp|svg'
    };
})(jQuery);
