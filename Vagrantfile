# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  config.vm.box = "Hubot"

  # The url from where the 'config.vm.box' box will be fetched if it
  # doesn't already exist on the user's system.
  config.vm.box_url = "http://wall/hubot.box"
  config.vm.hostname = "dibsy-dev.intranet.1stdibs.com"
  config.ssh.username = "root"

  # Share an additional folder to the guest VM. The first argument is
  # the path on the host to the actual folder. The second argument is
  # the path on the guest to mount the folder. And the optional third
  # argument is a set of non-required options.
  config.vm.synced_folder(".", nil, :disabled => true, :id => "vagrant-root")
  config.vm.synced_folder "~/projects/hubot-scripts", "/var/lib/dibsy/node_modules/hubot-1stdibs"

  # Provider-specific configuration so you can fine-tune various
  # backing providers for Vagrant. These expose provider-specific options.
  config.vm.provider :virtualbox do |vb|

    # By default, vagrant starts virualbox in "headless" mode, with no gui
    # If you WANT the virtualbox ui, set vb.gui to true
    #vb.gui = true

    # Use VBoxManage to customize the VM. For example to change memory:
    vb.customize ["modifyvm", :id, "--memory", "768"]
    vb.customize ["modifyvm", :id, "--cpus", "2"]
    vb.customize ["modifyvm", :id, "--ioapic", "on"]
    vb.customize ["modifyvm", :id, "--natdnshostresolver1", "on"]
  end

end
