#!/bin/bash

# Script to extract questions, options, answers, and explanations from HTML quiz files
# Usage: 
#   ./extract_quiz.sh                    # Process all .html files in current directory
#   ./extract_quiz.sh file.html          # Process a specific HTML file
#   ./extract_quiz.sh /path/to/dir       # Process all .html files in specified directory

# Function to process a single HTML file
process_file() {
    local HTML_FILE="$1"
    
    # Check if file exists
    if [ ! -f "$HTML_FILE" ]; then
        echo "Error: File '$HTML_FILE' does not exist" >&2
        return 1
    fi
    
    # Generate output filename (replace .html with .json)
    local OUTPUT_FILE="${HTML_FILE%.html}.json"
    
    # Extract questions using perl to handle HTML properly
    perl -0 -ne '
        use strict;
        use warnings;
        
        # Function to strip HTML tags and decode entities
        sub strip_html {
            my ($text) = @_;
            return "" unless defined $text;
            
            # Remove HTML tags
            $text =~ s/<[^>]+>//g;
            
            # Decode HTML entities
            $text =~ s/&amp;/&/g;
            $text =~ s/&lt;/</g;
            $text =~ s/&gt;/>/g;
            $text =~ s/&quot;/"/g;
            $text =~ s/&apos;/'"'"'/g;
            $text =~ s/&nbsp;/ /g;
            
            # Clean up whitespace
            $text =~ s/\s+/ /g;
            $text =~ s/^\s+|\s+$//g;
            
            return $text;
        }
        
        # Function to JSON escape a string
        sub json_escape {
            my ($text) = @_;
            return "" unless defined $text;
            
            $text =~ s/\\/\\\\/g;
            $text =~ s/"/\\"/g;
            $text =~ s/\n/\\n/g;
            $text =~ s/\r/\\r/g;
            $text =~ s/\t/\\t/g;
            
            return $text;
        }
        
        # Split by question divs (using lookahead to preserve delimiter content)
        my $content = $_;
        my @json_questions;
        
        # Find all question blocks
        while ($content =~ /<div class="hdq_question"[^>]*>(.*?)<\/div>\s*(?=<div class="hdq_question"|<\/div>\s*<div class="hdq_finish"|$)/gs) {
            my $q_block = $1;
            
            # Extract question text (remove #N. prefix)
            my $question_text = "";
            if ($q_block =~ /<h3 class="hdq_question_heading">\s*<span class="hdq_question_number">#[^<]+<\/span>\s*(.*?)<\/h3>/s) {
                $question_text = strip_html($1);
            }
            next unless $question_text;
            
            # Extract options and correct answer
            my @options;
            my $correct_index = -1;
            my $option_index = 0;
            
            # Find all option inputs with their corresponding labels
            while ($q_block =~ /<input[^>]*class="[^"]*hdq_option[^"]*"[^>]*value="(\d+)"[^>]*>[\s\S]*?<span class="hdq_aria_label">\s*(.*?)\s*<\/span>/gs) {
                my $value = $1;
                my $option_text = strip_html($2);
                
                push @options, $option_text;
                
                # If this input has value="1", it'"'"'s the correct answer
                if ($value eq "1" && $correct_index == -1) {
                    $correct_index = $option_index;
                }
                $option_index++;
            }
            
            # Skip if no options found or no correct answer identified
            next unless @options > 0 && $correct_index >= 0;
            
            # Extract explanation
            my $explanation = "";
            if ($q_block =~ /<div class="hdq_question_after_text"[^>]*>(.*?)<\/div>/s) {
                $explanation = strip_html($1);
            }
            
            # Build JSON object
            my $json = "    {\n";
            $json .= "      \"question\": \"" . json_escape($question_text) . "\",\n";
            $json .= "      \"options\": [\n";
            for my $i (0..$#options) {
                $json .= "        \"" . json_escape($options[$i]) . "\"";
                $json .= "," if $i < $#options;
                $json .= "\n";
            }
            $json .= "      ],\n";
            $json .= "      \"correctAnswer\": $correct_index,\n";
            $json .= "      \"explanation\": \"" . json_escape($explanation) . "\"\n";
            $json .= "    }";
            
            push @json_questions, $json;
        }
        
        # Output JSON array
        print "[\n";
        for my $i (0..$#json_questions) {
            print $json_questions[$i];
            print "," if $i < $#json_questions;
            print "\n";
        }
        print "]\n";
    ' "$HTML_FILE" > "$OUTPUT_FILE"
    
    # Check if extraction was successful
    if [ ! -s "$OUTPUT_FILE" ]; then
        echo "Error: Failed to extract questions from '$HTML_FILE'" >&2
        return 1
    fi
    
    # Validate and format JSON (if jq is available)
    if command -v jq >/dev/null 2>&1; then
        jq . "$OUTPUT_FILE" > "${OUTPUT_FILE}.tmp" 2>/dev/null
        if [ $? -eq 0 ]; then
            mv "${OUTPUT_FILE}.tmp" "$OUTPUT_FILE"
        else
            rm -f "${OUTPUT_FILE}.tmp"
            echo "Warning: Generated JSON may have formatting issues for '$OUTPUT_FILE'" >&2
        fi
    fi
    
    echo "✓ Processed '$HTML_FILE' -> '$OUTPUT_FILE'"
    return 0
}

# Main script logic
if [ $# -eq 0 ]; then
    # No arguments: process all .html files in current directory
    SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
    HTML_FILES=("$SCRIPT_DIR"/*.html)
    
    if [ ! -e "${HTML_FILES[0]}" ]; then
        echo "Error: No .html files found in '$SCRIPT_DIR'" >&2
        exit 1
    fi
    
    PROCESSED=0
    FAILED=0
    
    for html_file in "${HTML_FILES[@]}"; do
        if process_file "$html_file"; then
            ((PROCESSED++))
        else
            ((FAILED++))
        fi
    done
    
    echo ""
    echo "Summary: $PROCESSED file(s) processed successfully"
    if [ $FAILED -gt 0 ]; then
        echo "         $FAILED file(s) failed"
        exit 1
    fi
elif [ -d "$1" ]; then
    # Argument is a directory: process all .html files in that directory
    DIR="$1"
    HTML_FILES=("$DIR"/*.html)
    
    if [ ! -e "${HTML_FILES[0]}" ]; then
        echo "Error: No .html files found in '$DIR'" >&2
        exit 1
    fi
    
    PROCESSED=0
    FAILED=0
    
    for html_file in "${HTML_FILES[@]}"; do
        if process_file "$html_file"; then
            ((PROCESSED++))
        else
            ((FAILED++))
        fi
    done
    
    echo ""
    echo "Summary: $PROCESSED file(s) processed successfully"
    if [ $FAILED -gt 0 ]; then
        echo "         $FAILED file(s) failed"
        exit 1
    fi
elif [ -f "$1" ]; then
    # Argument is a file: process just that file
    if process_file "$1"; then
        exit 0
    else
        exit 1
    fi
else
    echo "Error: '$1' is not a valid file or directory" >&2
    echo "Usage: $0 [file.html | directory]" >&2
    echo "       $0                  # Process all .html files in script directory" >&2
    exit 1
fi

exit 0
