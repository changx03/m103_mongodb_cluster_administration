if Vagrant::VERSION < "2.0.0"
  $stderr.puts "Must redirect to new repository for old Vagrant versions"
  Vagrant::DEFAULT_SERVER_URL.replace('https://vagrantcloud.com')
end

Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/trusty64"
  config.vm.box_check_update = false
  config.vm.synced_folder "shared/", "/shared", create: true
  config.vm.synced_folder "dataset/", "/dataset", create: true

  config.vm.define "mongod-m103" do |server|
    server.vm.provider "virtualbox" do |vb|
	     vb.customize ["modifyvm", :id, "--cpus", "2"]
       vb.name = "mongod-m103"
       vb.memory = 2048
    end
    server.vm.hostname = "m103.mongodb.university"
    server.vm.network :private_network, ip: "192.168.103.100"
    server.vm.provision :shell, path: "provision-mongod", args: ENV['ARGS']
  end
end
