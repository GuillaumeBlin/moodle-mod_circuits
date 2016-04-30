<?php

class circuits_data implements renderable {
    public $title;
    public $json; 
    public function __construct(stdclass $circuits, $anonymous = false, array $attachments = null) {
	$this->title=$circuits->name;
	$this->json=$circuits->json;
	$this->width=$circuits->width;
	$this->height=$circuits->height;
	$this->toolbox=$circuits->toolbox;
	$this->devices=$circuits->devices;
    }
}
 
class mod_circuits_renderer extends plugin_renderer_base {
 
    protected function render_circuits_data(circuits_data $data) {
        $out  = $this->output->heading(format_string($data->title), 2);
	$out .= $this->output->box_start();
	$out .= get_string('circuitsinfo', 'circuits');
	$out .= $this->output->box_end();
	$out .=  $this->output->container_start('simcir-global');
	$out .=  $this->output->container_start('simcir', 'Archisimcir');
	$orig=json_decode($data->json);
	if (!is_object($orig)) {
                $orig = new stdClass;
        }
	$orig->width=($data->width?$data->width:200);
	$orig->height=($data->height?$data->height:200);
	$dev=json_decode($data->devices);
	$t=explode("#",$data->toolbox);
	if (is_object($dev)) {
		foreach($dev as $d){
			array_push($t,$d->id);
		}
	}
	$to="[";	
	foreach($t as $v){
		$to.='{"type":"'.$v.'"},';
	}
	$to=rtrim($to,",");
	$to.=']';
	$orig->toolbox=($data->toolbox?json_decode($to):array());
  	$out .= json_encode($orig);
	$out .= $this->output->container_end();
	$out .= $this->output->container_end();
        return $this->output->container($out, 'circuits');
    }
}
 
