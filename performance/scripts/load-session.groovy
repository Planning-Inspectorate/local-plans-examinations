// Each load thread gets its own authenticated browser session.
if (!vars.get('sessionLoaded')) {
    def file = new File(props.get('privateDir'), "manage-${ctx.threadNum + 1}.cookies")
    sampler.cookieManager.addFile(file.path)
    vars.put('sessionLoaded', 'true')
}
