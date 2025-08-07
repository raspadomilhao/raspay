"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Trash2, Edit, Plus, Save, X, Zap, Star, Gift, Trophy, Sparkles, Crown, Diamond, Coins, ChevronUp, ChevronDown, GripVertical, Lock, AlertCircle } from 'lucide-react'
import { toast } from "sonner"

interface Game {
  id: number
  game_id: string
  name: string
  description: string
  min_bet: number
  max_prize: number
  image_url: string
  gradient_from: string
  gradient_to: string
  icon: string
  is_active: boolean
  display_order: number
}

const iconOptions = [
  { value: 'Zap', label: 'Raio', icon: Zap },
  { value: 'Star', label: 'Estrela', icon: Star },
  { value: 'Gift', label: 'Presente', icon: Gift },
  { value: 'Trophy', label: 'Troféu', icon: Trophy },
  { value: 'Sparkles', label: 'Brilhos', icon: Sparkles },
  { value: 'Crown', label: 'Coroa', icon: Crown },
  { value: 'Diamond', label: 'Diamante', icon: Diamond },
  { value: 'Coins', label: 'Moedas', icon: Coins },
]

const gradientOptions = [
  { from: 'cyan-500', to: 'blue-500', label: 'Azul Ciano' },
  { from: 'yellow-500', to: 'orange-500', label: 'Amarelo Laranja' },
  { from: 'purple-500', to: 'pink-500', label: 'Roxo Rosa' },
  { from: 'green-500', to: 'emerald-500', label: 'Verde Esmeralda' },
  { from: 'red-500', to: 'pink-500', label: 'Vermelho Rosa' },
  { from: 'indigo-500', to: 'purple-500', label: 'Índigo Roxo' },
]

export default function EditarJogosPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authError, setAuthError] = useState("")
  const [games, setGames] = useState<Game[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    game_id: '',
    name: '',
    description: '',
    min_bet: 1.00,
    max_prize: 1000.00,
    image_url: '',
    gradient_from: 'cyan-500',
    gradient_to: 'blue-500',
    icon: 'Zap',
    is_active: true,
    display_order: 0
  })

  const handleAuthentication = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAuthenticating(true)
    setAuthError("")

    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setIsAuthenticated(true)
        toast.success("Acesso autorizado!")
        fetchGames()
      } else {
        setAuthError(data.error || "Senha incorreta")
        toast.error(data.error || "Senha incorreta")
      }
    } catch (error) {
      setAuthError("Erro de conexão com o servidor")
      toast.error("Erro de conexão com o servidor")
    } finally {
      setIsAuthenticating(false)
    }
  }

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/admin/games')
      if (response.ok) {
        const data = await response.json()
        setGames(data.games)
      }
    } catch (error) {
      console.error('Erro ao buscar jogos:', error)
      toast.error('Erro ao carregar jogos')
    } finally {
      setIsLoading(false)
    }
  }

  const parseNumber = (value: any): number => {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const parsed = parseFloat(value)
      return isNaN(parsed) ? 0 : parsed
    }
    return 0
  }

  const formatCurrency = (value: any): string => {
    const num = parseNumber(value)
    return num.toFixed(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingGame ? `/api/admin/games/${editingGame.id}` : '/api/admin/games'
      const method = editingGame ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          min_bet: parseNumber(formData.min_bet),
          max_prize: parseNumber(formData.max_prize),
          display_order: parseNumber(formData.display_order)
        })
      })

      if (response.ok) {
        toast.success(editingGame ? 'Jogo atualizado!' : 'Jogo criado!')
        setIsDialogOpen(false)
        resetForm()
        fetchGames()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao salvar jogo')
      }
    } catch (error) {
      console.error('Erro ao salvar jogo:', error)
      toast.error('Erro ao salvar jogo')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este jogo?')) return

    try {
      const response = await fetch(`/api/admin/games/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Jogo deletado!')
        fetchGames()
      } else {
        toast.error('Erro ao deletar jogo')
      }
    } catch (error) {
      console.error('Erro ao deletar jogo:', error)
      toast.error('Erro ao deletar jogo')
    }
  }

  const handleEdit = (game: Game) => {
    setEditingGame(game)
    setFormData({
      game_id: game.game_id,
      name: game.name,
      description: game.description || '',
      min_bet: parseNumber(game.min_bet),
      max_prize: parseNumber(game.max_prize),
      image_url: game.image_url || '',
      gradient_from: game.gradient_from || 'cyan-500',
      gradient_to: game.gradient_to || 'blue-500',
      icon: game.icon || 'Zap',
      is_active: game.is_active,
      display_order: parseNumber(game.display_order)
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setEditingGame(null)
    setFormData({
      game_id: '',
      name: '',
      description: '',
      min_bet: 1.00,
      max_prize: 1000.00,
      image_url: '',
      gradient_from: 'cyan-500',
      gradient_to: 'blue-500',
      icon: 'Zap',
      is_active: true,
      display_order: 0
    })
  }

  const moveGame = async (gameId: number, direction: 'up' | 'down') => {
    const currentIndex = games.findIndex(g => g.id === gameId)
    if (currentIndex === -1) return

    const newGames = [...games]
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    if (targetIndex < 0 || targetIndex >= newGames.length) return

    // Trocar posições
    [newGames[currentIndex], newGames[targetIndex]] = [newGames[targetIndex], newGames[currentIndex]]

    // Atualizar display_order baseado na nova posição
    const updatedGames = newGames.map((game, index) => ({
      ...game,
      display_order: (index + 1) * 10
    }))

    try {
      const response = await fetch('/api/admin/games', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          games: updatedGames.map(g => ({ id: g.id, display_order: g.display_order }))
        })
      })

      if (response.ok) {
        setGames(updatedGames)
        toast.success('Ordem atualizada!')
      } else {
        toast.error('Erro ao atualizar ordem')
      }
    } catch (error) {
      console.error('Erro ao reordenar:', error)
      toast.error('Erro ao atualizar ordem')
    }
  }

  const selectedIcon = iconOptions.find(opt => opt.value === formData.icon)
  const IconComponent = selectedIcon?.icon || Zap

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900/50 border-slate-700">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-white">Acesso Restrito</CardTitle>
            <p className="text-gray-400">Digite a senha para editar jogos</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuthentication} className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-white">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                  placeholder="Digite a senha administrativa"
                  required
                />
                {authError && (
                  <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{authError}</span>
                  </div>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                disabled={isAuthenticating}
              >
                {isAuthenticating ? "Verificando..." : "Acessar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 sm:gap-0">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Gerenciar Jogos</h1>
            <p className="text-gray-400 text-sm sm:text-base">Configure os jogos da plataforma e organize a ordem</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 w-full sm:w-auto"
                onClick={resetForm}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Jogo
              </Button>
            </DialogTrigger>
            
            {/* Modal otimizado para mobile */}
            <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] bg-slate-900 border-slate-700 text-white p-0 gap-0 overflow-hidden">
              <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-4 border-b border-slate-700">
                <DialogTitle className="text-lg sm:text-xl">
                  {editingGame ? 'Editar Jogo' : 'Novo Jogo'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-4 sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  {/* Campos básicos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="game_id" className="text-sm font-medium">ID do Jogo</Label>
                      <Input
                        id="game_id"
                        value={formData.game_id}
                        onChange={(e) => setFormData({...formData, game_id: e.target.value})}
                        placeholder="ex: novo-jogo"
                        disabled={!!editingGame}
                        className="bg-slate-800 border-slate-600 h-10 sm:h-11"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">Nome</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Nome do jogo"
                        className="bg-slate-800 border-slate-600 h-10 sm:h-11"
                        required
                      />
                    </div>
                  </div>

                  {/* Descrição */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Descrição do jogo"
                      className="bg-slate-800 border-slate-600 min-h-[80px] resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Valores monetários e ordem */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="min_bet" className="text-sm font-medium">Aposta Mínima (R$)</Label>
                      <Input
                        id="min_bet"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.min_bet}
                        onChange={(e) => setFormData({...formData, min_bet: parseFloat(e.target.value) || 0})}
                        className="bg-slate-800 border-slate-600 h-10 sm:h-11"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="max_prize" className="text-sm font-medium">Prêmio Máximo (R$)</Label>
                      <Input
                        id="max_prize"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.max_prize}
                        onChange={(e) => setFormData({...formData, max_prize: parseFloat(e.target.value) || 0})}
                        className="bg-slate-800 border-slate-600 h-10 sm:h-11"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="display_order" className="text-sm font-medium">Ordem de Exibição</Label>
                      <Input
                        id="display_order"
                        type="number"
                        min="0"
                        value={formData.display_order}
                        onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value) || 0})}
                        className="bg-slate-800 border-slate-600 h-10 sm:h-11"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* URL da imagem */}
                  <div className="space-y-2">
                    <Label htmlFor="image_url" className="text-sm font-medium">URL da Imagem</Label>
                    <Input
                      id="image_url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                      placeholder="/images/banner-jogo.png"
                      className="bg-slate-800 border-slate-600 h-10 sm:h-11"
                    />
                  </div>

                  {/* Ícone e Gradiente */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Ícone</Label>
                      <Select value={formData.icon} onValueChange={(value) => setFormData({...formData, icon: value})}>
                        <SelectTrigger className="bg-slate-800 border-slate-600 h-10 sm:h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          {iconOptions.map((option) => {
                            const Icon = option.icon
                            return (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center space-x-2">
                                  <Icon className="h-4 w-4" />
                                  <span>{option.label}</span>
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Gradiente</Label>
                      <Select 
                        value={`${formData.gradient_from}-${formData.gradient_to}`}
                        onValueChange={(value) => {
                          const [from, to] = value.split('-')
                          setFormData({...formData, gradient_from: from, gradient_to: to})
                        }}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-600 h-10 sm:h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          {gradientOptions.map((option) => (
                            <SelectItem key={`${option.from}-${option.to}`} value={`${option.from}-${option.to}`}>
                              <div className="flex items-center space-x-2">
                                <div className={`w-4 h-4 rounded bg-gradient-to-r from-${option.from} to-${option.to}`} />
                                <span className="text-sm">{option.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Switch ativo */}
                  <div className="flex items-center space-x-3 py-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                    />
                    <Label htmlFor="is_active" className="text-sm font-medium">Jogo Ativo</Label>
                  </div>

                  {/* Preview */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Preview</Label>
                    <Card className="bg-slate-800 border-slate-600">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-bold text-sm sm:text-base">
                            {formData.name || 'Nome do Jogo'}
                          </h3>
                          <div className={`p-2 rounded-full bg-gradient-to-r from-${formData.gradient_from} to-${formData.gradient_to}`}>
                            <IconComponent className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          </div>
                        </div>
                        <p className="text-gray-400 text-xs sm:text-sm mb-3 line-clamp-2">
                          {formData.description || 'Descrição do jogo'}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <span>A partir de R$ {formatCurrency(formData.min_bet)}</span>
                          <span className="text-green-400">Até R$ {formatCurrency(formData.max_prize)}</span>
                        </div>
                        <Button 
                          type="button"
                          size="sm"
                          className={`w-full bg-gradient-to-r from-${formData.gradient_from} to-${formData.gradient_to} h-8 sm:h-9 text-xs sm:text-sm`}
                        >
                          Jogar Agora
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </form>
              </div>

              {/* Botões fixos na parte inferior */}
              <div className="border-t border-slate-700 p-4 sm:p-6 bg-slate-900">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="border-slate-600 text-white hover:bg-slate-800 h-10 sm:h-11 flex-1 sm:flex-none sm:min-w-[100px]"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 h-10 sm:h-11 flex-1 sm:flex-none sm:min-w-[100px]"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de Jogos com controles de ordenação */}
        <div className="space-y-4">
          {games.map((game, index) => {
            const IconComponent = iconOptions.find(opt => opt.value === game.icon)?.icon || Zap
            
            return (
              <Card key={game.id} className="bg-slate-900 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Controles de ordenação */}
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveGame(game.id, 'up')}
                        disabled={index === 0}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-white disabled:opacity-30"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveGame(game.id, 'down')}
                        disabled={index === games.length - 1}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-white disabled:opacity-30"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Indicador de posição */}
                    <div className="flex items-center justify-center w-8 h-8 bg-slate-800 rounded-full text-sm font-bold text-gray-400">
                      {index + 1}
                    </div>

                    {/* Ícone do jogo */}
                    <div className={`p-2 rounded-full bg-gradient-to-r from-${game.gradient_from} to-${game.gradient_to}`}>
                      <IconComponent className="h-4 w-4 text-white" />
                    </div>

                    {/* Informações do jogo */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-bold">{game.name}</h3>
                        <Badge variant={game.is_active ? "default" : "secondary"}>
                          {game.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-sm">ID: {game.game_id}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>R$ {formatCurrency(game.min_bet)}</span>
                        <span className="text-green-400">R$ {formatCurrency(game.max_prize)}</span>
                        <span>Ordem: {game.display_order}</span>
                      </div>
                    </div>

                    {/* Imagem do jogo (se houver) */}
                    {game.image_url && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden">
                        <img 
                          src={game.image_url || "/placeholder.svg"} 
                          alt={game.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Botões de ação */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(game)}
                        className="border-slate-600 text-white hover:bg-slate-800"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(game.id)}
                        className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {games.length === 0 && (
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-8 text-center">
              <Zap className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-white text-lg font-semibold mb-2">Nenhum jogo encontrado</h3>
              <p className="text-gray-400 mb-4">Comece criando seu primeiro jogo</p>
              <Button 
                onClick={() => {
                  resetForm()
                  setIsDialogOpen(true)
                }}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Jogo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
