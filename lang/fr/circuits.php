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
 * English strings for circuits
 *
 *
 * @package    mod_circuits
 * @copyright  2016 Guillaume Blin
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['modulename'] = 'circuits';
$string['modulenameplural'] = 'circuits';
$string['modulename_help'] = 'Use the circuits module to design and test circuits.<br/> The circuits module allows to design, test and evaluate logical and sequential circuits';
$string['circuitsname'] = 'Circuits name';
$string['circuitstoolbox'] = 'Composants de la boîte à outils ';
$string['circuitstoolboxcomponents'] = 'In#Out#DC#LED#PushOff#PushOn#Toggle#NOT#AND#NAND#OR#NOR#XOR#XNOR#1>1#1<1#BusIn#BusOut#4>4#4<4#4bit7segBus#RotaryEncoderBus#2to4Decoder#2to4DecoderBus#4to2PrioEncoder#Mux#Mux2#MuxBus#MuxBus2#Demux#DemuxBus#FullAdder#OrBus#AndBus1#EqualBus#AddBus#IncBus#NegBus#SubBus#D#D-E#RegBus#RegBus-E#OSC#CPU0#CPU1#ROM0#Virtual-In#Virtual-Out#BUF#XOR#XNOR#OSC#7seg#16seg#4bit7seg#RotaryEncoder#BusIn#BusOut#RS-FF#JK-FF#T-FF#D-FF#8bitCounter#HalfAdder#FullAdder#4bitAdder#2to4Decoder#3to8Decoder#4to16Decoder';
$string['circuitswidth']='Largeur du circuit';
$string['circuitsheight']='Hauteur du circuit';
$string['circuitsinfo'] = "
  <h3>Consignes</h3>
<ul>
<li>Prendre un composant dans la boîte à outils et le déplacer à droite.</li>
<li>Les connecter en glissant entre les connecteur.</li>
<li>Cliquer sur un connecteur d'entrée pour le déconnecter.</li>
<li>Déplacer un composant dans la boîte à outils si vous n'en avez plus besoin.</li>
<li>Double-Cliquer sur une étiquette pour editer le nom d'un composant.</li>
<li>Double-Cliquer sur une bibliothèque pour ouvrir le circuit à l'intérieur.</li>
<li>Ctrl+Clic(Mac:command+Clic) pour changer de vue (Circuit en live, ou données JSON).</li>
</ul>
";
$string['circuitsname_help'] = 'This is the content of the help tooltip associated with the circuitsname field. Markdown syntax is supported.';
$string['circuitsjson'] = 'json content of the initial circuit';
$string['circuitsjson_help'] = 'A valid description of the initial circuit should be provided in json format. 
<pre>
{
  "devices":[
  ],
  "connectors":[
  ]
}
</pre>.
For example,
<pre>
{
 "devices":[
    {"type":"DC","id":"dev0","x":216,"y":136,"label":"DC"},
    {"type":"LED","id":"dev1","x":312,"y":136,"label":"LED"}
  ],
  "connectors":[
    {"from":"dev1.in0","to":"dev0.out0"}
  ]
}
</pre>';
$string['circuitsdevices'] = 'json content of addon devices for toolbox as a json array of json circuits';
$string['circuitsdevices_help'] = 'A valid description of circuits should be provided in json format. 
<pre>
[
  {
    "id":"Foo",
    "json":
   {
      "width":500,
      "height":500,
      "showToolbox":false,
      "toolbox":[],
      "devices":[
 	...
      ],
      "connectors":[
        ...
      ]
   }
 },
 {
    "id":"Bar",
    "json":
   {
      "width":500,
      "height":500,
      "showToolbox":false,
      "toolbox":[],
      "devices":[
        ...
      ],
      "connectors":[
        ...
      ]
   }
 }
]</pre>';
$string['circuits'] = 'circuits';
$string['pluginadministration'] = 'Circuits administration';
$string['pluginname'] = 'circuits';
