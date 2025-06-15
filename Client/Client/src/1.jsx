{/* Project Info Field */}
<motion.div className="mb-8">
  <label className="block text-lg font-medium text-white flex items-center mb-2">
    <FiFileText className="mr-2 text-indigo-400" />
    Project Information
  </label>
  <textarea
    value={projectInfo}
    onChange={(e) => setProjectInfo(e.target.value)}
    placeholder="Brief description about the project..."
    className="w-full h-24 px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white resize-none"
  />
</motion.div>

{/* Abstract Field */}
<motion.div className="mb-8">
  <label className="block text-lg font-medium text-white flex items-center mb-2">
    <FiMessageSquare className="mr-2 text-indigo-400" />
    Abstract
  </label>
  <textarea
    value={abstractText}
    onChange={(e) => setAbstractText(e.target.value)}
    placeholder="High-level abstract overview..."
    className="w-full h-24 px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white resize-none"
  />
</motion.div>

{/* UML Instructions Field */}
<motion.div className="mb-8">
  <label className="block text-lg font-medium text-white flex items-center mb-2">
    <FiLayout className="mr-2 text-indigo-400" />
    UML Diagram Instructions
  </label>
  <textarea
    value={umlInstructions}
    onChange={(e) => setUmlInstructions(e.target.value)}
    placeholder="What kind of UML diagrams should be generated..."
    className="w-full h-24 px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white resize-none"
  />
</motion.div>
