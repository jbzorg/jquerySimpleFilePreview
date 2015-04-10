/* Copyright (c) 2012 Jordan Kasper
* Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
* Copyright notice and license must remain intact for legal use
* Requires: jQuery 1.2+
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
    'limit': 0                               // Limit files on multiple option
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
;(function($) {
    'use strict';

    $.fn.simpleFilePreview = function(options) {
        if (!this || !this.length) {
            return this;
        }

        // Set up options (and defaults)
        options = options ? options : {};
        options = $.extend({}, $.simpleFilePreview.defaults, options);

        this.each(function() {
            setup($(this), options);
        });

        // set up global events
        if ($.simpleFilePreview.init) {
            return this;
        }

        var $body = $('body');

        $.simpleFilePreview.init = true;

        // open file browser dialog on click of styled "button"
        $body.on('click', '.simpleFilePreview_input', function(e) {
            $(this).closest('.simpleFilePreview').find('input.simpleFilePreview_formInput').trigger('click');
            e.preventDefault();
        });

        // on click of the actual input (which is invisible), check to see if 
        // we need to clear the input (which is the default action for this plugin)
        $body.on('click', '.simpleFilePreview input.simpleFilePreview_formInput', function(e) {
            if (!$(this).val().length) {
                return this;
            }

            $(this).closest('.simpleFilePreview').find('.simpleFilePreview_preview').trigger('click');

            e.preventDefault();
        });

        // when file input changes, get file contents and show preview (if it's an image)
        $body.on('change', '.simpleFilePreview input.simpleFilePreview_formInput', function(e) {
            var $parents = $(this).closest('.simpleFilePreview');

            // if it's a multi-select, add another selection box to the end
            // NOTE: this is done first since we clone the previous input
            // NOTE: the second check is there because IE 8 fires multiple change events for no good reason
            if (($parents.attr('data-sfpallowmultiple') == 1) && !$parents.find('.simpleFilePreview_preview').length) {
                var newId = $.simpleFilePreview.uid++;
                var $newN = $parents.clone(true).attr('id', "simpleFilePreview_" + newId);

                $newN.find('input.simpleFilePreview_formInput')
                    .attr('id', $newN.find('input.simpleFilePreview_formInput').attr('id') + '_' + newId)
                    .val('');

                $parents.after($newN);

                var nw = $parents.closest('.simpleFilePreview_multi').width('+=' + $newN.outerWidth(true)).width();

                if (nw > $parents.closest('.simpleFilePreview_multiClip').width()) {
                    $parents.closest('.simpleFilePreview_multiUI').find('.simpleFilePreview_shiftRight').trigger('click');
                }
            }

            if (this.files && this.files[0]) {
                var exp = new RegExp("^image\/(" + $.simpleFilePreview.previewFileTypes + ")$");

                if (exp.test(this.files[0].type.toLowerCase()) && window.FileReader) {
                    // show preview of image file
                    var $FR = new FileReader();

                    $FR.onload = function(e) {
                        addOrChangePreview($parents, e.target.result, '', options);
                    };

                    $FR.readAsDataURL(this.files[0]);
                } else {
                    // show icon if not an image upload
                    var m = this.files[0].type.toLowerCase().match(/^\s*[^\/]+\/([a-zA-Z0-9\-\.]+)\s*$/);

                    if (m && m[1] && options.icons[m[1]]) {
                        addOrChangePreview($parents, options.icons[m[1]], getFilename(this.value), options);
                    } else {
                        addOrChangePreview($parents, options.defaultIcon, getFilename(this.value), options);
                    }
                }

                return this;
            }

            // Any browser not supporting the File API (and FileReader)

            // Some versions of IE don't have real paths, and can't support
            // any other way to do file preview without uploading to the server
            // If a browser does report a valid path (IE or otherwise), then 
            // we'll try to get the file preview

            var exp = new RegExp("^(" + $.simpleFilePreview.previewFileTypes + ")$");

            var ext = getFileExt(this.value);
            ext = ext ? ext.toLowerCase() : null;

            if (ext && !(/fakepath/.test(this.value.toLowerCase())) && exp.test(e)) {
                // older versions of IE (and some other browsers) report the local 
                // file path, so try to get a preview that way
                addOrChangePreview($parents, "file://" + this.value, '', options);
            } else {
                // not an image (or using fakepath), so no preview anyway
                if (options.icons[ext]) {
                    addOrChangePreview($parents, options.icons[ext], getFilename(this.value), options);
                } else {
                    addOrChangePreview($parents, options.defaultIcon, getFilename(this.value), options);
                }
            }
        });

        // show or hide "remove" icon for file preview/icon
        $body.on('mouseover', '.simpleFilePreview_preview, .simpleFilePreview input.simpleFilePreview_formInput', function() {
            var $parents = $(this).closest('.simpleFilePreview');

            if ($parents.find('.simpleFilePreview_preview').is(':visible')) {
                $parents.find('.simpleFilePreview_remove').show();
            }
        });

        $body.on('mouseout', '.simpleFilePreview_preview, .simpleFilePreview input.simpleFilePreview_formInput', function() {
            $(this).closest('.simpleFilePreview').find('.simpleFilePreview_remove').hide();
        })

        // remove file when preview/icon is clicked
        $body.on('click', '.simpleFilePreview_preview', function() {
            var $this = $(this);
            var $parents = $this.closest('.simpleFilePreview');

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
        });

        // shift buttons for multi-selects
        $body.on('click', '.simpleFilePreview_shiftRight', function() {
            var ul = $(this).closest('.simpleFilePreview_multiUI').find('.simpleFilePreview_multi');
            var width = parseInt(ul.css('left')) + ul.width();

            if (width > ul.parent().width()) {
                var li = ul.find('li:first');
                ul.animate({
                    'left': '-=' + li.outerWidth(true)
                });
            }
        });

        $body.on('click', '.simpleFilePreview_shiftLeft', function() {
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

    var limit = function($this, options, add) {
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

    var setup = function(these, options) {
        var isMulti = these.is('[multiple]');

        // "multiple" removed because it's handled later manually
        these = these.removeAttr('multiple').addClass('simpleFilePreview_formInput');

        // wrap input with necessary structure
        var $html = $("<" + (isMulti ? 'li' : 'div')
            + " id='simpleFilePreview_" + ($.simpleFilePreview.uid++) + "'"
            + " class='simpleFilePreview' data-sfpallowmultiple='" + (isMulti ? 1 : 0) + "'>"
            + "<a class='simpleFilePreview_input'><span class='simpleFilePreview_inputButtonText'>"
            + options.buttonContent + "</span></a>"
            + "<span class='simpleFilePreview_remove'>" + options.removeContent + "</span>"
            + "</" + (isMulti ? 'li' : 'div') + ">");

        these.before($html);
        $html.append(these);

        // mostly for IE, the file input must be sized the same as the container, 
        // opacity 0, and z-indexed above other elements within the preview container
        these.css({
            width: ($html.width() + 'px'),
            height: ($html.height() + 'px')
        });

        // if it's a multi-select we use multiple separate inputs instead to support file preview
        if (isMulti) {
            $html.wrap("<div class='simpleFilePreview_multiUI'><div class='simpleFilePreview_multiClip'><ul class='simpleFilePreview_multi'></ul></div></div>");
            $html.closest('.simpleFilePreview_multiUI')
                .prepend("<span class='simpleFilePreview_shiftRight simpleFilePreview_shifter'>" + options.shiftRight + "</span>")
                .append("<span class='simpleFilePreview_shiftLeft simpleFilePreview_shifter'>" + options.shiftLeft + "</span>");
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

                nn.addClass('simpleFilePreview_existing')
                    .attr('data-sfprid', arr ? exists[i] : i)
                    .find('input.simpleFilePreview_formInput').remove();

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
            }

            $('.simpleFilePreview_multi').width($html.outerWidth(true) * $html.parent().find('.simpleFilePreview').length);

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

    var addOrChangePreview = function($parents, src, filename, options) {
        filename = filename ? filename : null;
        src = ((new RegExp('[/\\\\]')).test(src) ? '' : (options.iconPath)) + src

        $parents.find('.simpleFilePreview_input').hide();

        var $image = $parents.find('.simpleFilePreview_preview');

        if ($image && $image.length) {
            $image.attr('src', src);
        } else {
            $parents.append("<img src='" + src + "'"
                + " class='simpleFilePreview_preview " + (filename ? 'simpleFilePreview_hasFilename' : '') + "'"
                + " alt='" + (filename ? filename : 'File Preview') + "'"
                + " title='Remove " + (filename ? filename : 'this file') + "' />");

            // for tooltips
            $parents.find('input.simpleFilePreview_formInput').attr('title', "Remove " + (filename ? filename : 'this file'));
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

    var getFilename = function($parents) {
        var m = $parents.match(/[\/\\]([^\/\\]+)$/);

        if (m && m[1] && m[1].length) {
            return m[1];
        }

        return null;
    };

    var getFileExt = function($parents) {
        var m = $parents.match(/[\.]([^\/\\\.]+)$/);

        if (m && m[1] && m[1].length) {
            return m[1];
        }

        return null;
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
                'doc': 'preview_doc.png',
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
        init: false,
        previewFileTypes: 'p?jpe?g|png|gif|bmp|svg'
    };
})(jQuery);
