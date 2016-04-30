<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Prints a particular instance of circuits
 *
 * @package    mod_circuits
 * @copyright  2016 Guillaume Blin
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');


$id = optional_param('id', 0, PARAM_INT); // Course_module ID, or
$n  = optional_param('c', 0, PARAM_INT);  // ... circuits instance ID - it should be named as the first character of the module.

if ($id) {
    $cm         = get_coursemodule_from_id('circuits', $id, 0, false, MUST_EXIST);
    $course     = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $circuits  = $DB->get_record('circuits', array('id' => $cm->instance), '*', MUST_EXIST);
} else if ($n) {
    $circuits  = $DB->get_record('circuits', array('id' => $n), '*', MUST_EXIST);
    $course     = $DB->get_record('course', array('id' => $circuits->course), '*', MUST_EXIST);
    $cm         = get_coursemodule_from_instance('circuits', $circuits->id, $course->id, false, MUST_EXIST);
} else {
    error('You must specify a course_module ID or an instance ID');
}
require_login($course, true, $cm);
// Print the page header.

$PAGE->set_url('/mod/circuits/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($circuits->name));
$PAGE->set_heading(format_string($course->fullname));

$output = $PAGE->get_renderer('mod_circuits');

$circuitswidget = new circuits_data($circuits, false);
echo $output->header();
echo $output->render($circuitswidget);

$PAGE->requires->js_call_amd('mod_circuits/simcir','init');
$PAGE->requires->js_call_amd('mod_circuits/simcir','addBasicSet');

$PAGE->requires->js_call_amd('mod_circuits/simcir','library');
$PAGE->requires->js_call_amd('mod_circuits/simcir','addDevice',array($circuits->devices));
$PAGE->requires->js_call_amd('mod_circuits/simcir','addVirtualPort');
$PAGE->requires->js_call_amd('mod_circuits/simcir','start');
echo $output->footer();	
